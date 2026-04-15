import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import { sendResponse } from '../utils/response.js';
import {
  createAppointmentRecord,
  expireNoShowAppointmentIfNeeded,
  getAppointmentsForUser,
} from '../services/appointmentService.js';
import { createNotification, createNotificationsBatch } from '../services/notificationService.js';
import { emitToUser } from '../socket/socketHandler.js';
import { canJoinMeeting } from '../utils/time.js';

const sanitizeAppointment = (appointment) => {
  if (!appointment) return appointment;
  const plain = typeof appointment.toObject === 'function' ? appointment.toObject() : appointment;
  const { meetingLink, ...safeAppointment } = plain;
  return safeAppointment;
};

const getJoinWindowError = (state) => {
  if (state === 'too_early') {
    return 'Meeting is not open yet. You can join only at or after the appointment start time.';
  }

  return 'Meeting access has expired for this appointment.';
};

export const createAppointment = async (req, res) => {
  try {
    const { doctorId, patientId, proposedTime, duration, createdVia = 'chat', notes = '', meetingLink = '' } = req.body;

    if (!doctorId || !patientId || !proposedTime || !duration) {
      return sendResponse(res, 400, false, 'doctorId, patientId, proposedTime and duration are required');
    }

    if (req.user.role !== 'doctor' || String(req.user._id) !== String(doctorId)) {
      return sendResponse(res, 403, false, 'Only the proposing doctor can create this appointment');
    }

    const [doctor, patient] = await Promise.all([
      User.findById(doctorId).lean(),
      User.findById(patientId).lean(),
    ]);

    if (!doctor || doctor.role !== 'doctor') {
      return sendResponse(res, 404, false, 'Doctor not found');
    }

    if (!patient || patient.role !== 'patient') {
      return sendResponse(res, 404, false, 'Patient not found');
    }

    const appointment = await createAppointmentRecord({
      doctorId,
      patientId,
      proposedTime,
      duration,
      createdVia,
      notes,
      meetingLink,
    });

    const populated = await Appointment.findById(appointment._id)
      .populate('doctorId', 'name email specialization')
      .populate('patientId', 'name email')
      .lean();

    const safePopulated = sanitizeAppointment(populated);

    emitToUser(String(patientId), 'appointment_status_updated', {
      appointmentId: String(appointment._id),
      status: 'pending',
      appointment: safePopulated,
    });

    await createNotificationsBatch([
      {
        userId: patientId,
        type: 'appointment',
        title: 'New Appointment Proposal',
        message: `Dr. ${doctor.name} proposed an appointment on ${new Date(populated.startTime).toLocaleString()}.`,
        relatedId: appointment._id,
      },
      {
        userId: patientId,
        type: 'reminder',
        title: 'Appointment Reminder Created',
        message: `Reminder: Appointment with Dr. ${doctor.name} is scheduled for ${new Date(populated.startTime).toLocaleString()}.`,
        relatedId: appointment._id,
      },
    ]);

    return sendResponse(res, 201, true, 'Appointment created', safePopulated);
  } catch (error) {
    console.error('Create appointment error:', error);
    const statusCode = error.statusCode || 500;
    return sendResponse(res, statusCode, false, error.message || 'Error creating appointment');
  }
};

export const getMyAppointments = async (req, res) => {
  try {
    if (!['doctor', 'patient'].includes(req.user.role)) {
      return sendResponse(res, 403, false, 'Only doctors or patients can view appointments');
    }

    const appointments = await getAppointmentsForUser(req.user);
    const safeAppointments = appointments.map((appointment) => sanitizeAppointment(appointment));
    return sendResponse(res, 200, true, 'Appointments fetched', safeAppointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    return sendResponse(res, 500, false, error.message || 'Error fetching appointments');
  }
};

export const confirmAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return sendResponse(res, 404, false, 'Appointment not found');
    }

    if (req.user.role !== 'patient' || String(req.user._id) !== String(appointment.patientId)) {
      return sendResponse(res, 403, false, 'Only the patient can confirm this appointment');
    }

    if (appointment.status !== 'pending') {
      return sendResponse(res, 400, false, 'Only pending appointments can be confirmed');
    }

    appointment.status = 'confirmed';
    if (!appointment.meetingLink) {
      appointment.meetingLink = `https://meet.jit.si/meditalk-${appointment._id}`;
    }
    await appointment.save();

    const populated = await Appointment.findById(id)
      .populate('doctorId', 'name email specialization')
      .populate('patientId', 'name email')
      .lean();

    const safePopulated = sanitizeAppointment(populated);

    emitToUser(String(appointment.doctorId), 'appointment_status_updated', {
      appointmentId: String(appointment._id),
      status: 'confirmed',
      appointment: safePopulated,
    });

    await createNotification({
      userId: appointment.doctorId,
      type: 'appointment',
      title: 'Appointment Confirmed',
      message: `Your appointment on ${new Date(populated.startTime).toLocaleString()} was confirmed by ${populated.patientId?.name || 'patient'}.`,
      relatedId: appointment._id,
    });

    return sendResponse(res, 200, true, 'Appointment confirmed', safePopulated);
  } catch (error) {
    console.error('Confirm appointment error:', error);
    return sendResponse(res, 500, false, error.message || 'Error confirming appointment');
  }
};

export const getJoinLink = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return sendResponse(res, 404, false, 'Appointment not found');
    }

    const isParticipant =
      String(req.user._id) === String(appointment.doctorId) ||
      String(req.user._id) === String(appointment.patientId);

    if (!isParticipant) {
      return sendResponse(res, 403, false, 'Only appointment participants can access join link');
    }

    if (appointment.status !== 'confirmed') {
      return sendResponse(res, 400, false, 'Only confirmed appointments can be joined');
    }

    const joinAccess = canJoinMeeting(appointment);
    if (joinAccess.state !== 'allowed') {
      if (joinAccess.state === 'expired' && !appointment.hasJoined) {
        appointment.status = 'cancelled';
        appointment.cancellationReason = 'no_show';
        await appointment.save();
      }
      return sendResponse(res, 400, false, getJoinWindowError(joinAccess.state), {
        state: joinAccess.state,
      });
    }

    if (!appointment.meetingLink) {
      appointment.meetingLink = `https://meet.jit.si/meditalk-${appointment._id}`;
      await appointment.save();
    }

    return sendResponse(res, 200, true, 'Join link fetched', {
      meetingLink: appointment.meetingLink,
      state: 'allowed',
    });
  } catch (error) {
    console.error('Get join link error:', error);
    return sendResponse(res, 500, false, error.message || 'Error fetching join link');
  }
};

export const joinAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return sendResponse(res, 404, false, 'Appointment not found');
    }

    const isParticipant =
      String(req.user._id) === String(appointment.doctorId) ||
      String(req.user._id) === String(appointment.patientId);

    if (!isParticipant) {
      return sendResponse(res, 403, false, 'Only appointment participants can join meeting');
    }

    if (appointment.status !== 'confirmed') {
      return sendResponse(res, 400, false, 'Only confirmed appointments can be joined');
    }

    const joinAccess = canJoinMeeting(appointment);
    if (joinAccess.state !== 'allowed') {
      if (joinAccess.state === 'expired' && !appointment.hasJoined) {
        appointment.status = 'cancelled';
        appointment.cancellationReason = 'no_show';
        await appointment.save();
      }
      return sendResponse(res, 400, false, getJoinWindowError(joinAccess.state), {
        state: joinAccess.state,
      });
    }

    appointment.hasJoined = true;
    appointment.joinedAt = new Date();
    await appointment.save();

    const populated = await Appointment.findById(id)
      .populate('doctorId', 'name email specialization')
      .populate('patientId', 'name email')
      .lean();

    return sendResponse(res, 200, true, 'Meeting joined', sanitizeAppointment(populated));
  } catch (error) {
    console.error('Join appointment error:', error);
    return sendResponse(res, 500, false, error.message || 'Error joining meeting');
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return sendResponse(res, 404, false, 'Appointment not found');
    }

    const canCancel =
      (req.user.role === 'doctor' && String(req.user._id) === String(appointment.doctorId)) ||
      (req.user.role === 'patient' && String(req.user._id) === String(appointment.patientId));

    if (!canCancel) {
      return sendResponse(res, 403, false, 'You do not have permission to cancel this appointment');
    }

    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return sendResponse(res, 400, false, 'This appointment cannot be cancelled');
    }

    appointment.status = 'cancelled';
    appointment.cancellationReason = 'manual';
    await appointment.save();

    const populated = await Appointment.findById(id)
      .populate('doctorId', 'name email specialization')
      .populate('patientId', 'name email')
      .lean();

    const otherUserId =
      String(req.user._id) === String(appointment.doctorId)
        ? String(appointment.patientId)
        : String(appointment.doctorId);

    const safePopulated = sanitizeAppointment(populated);

    emitToUser(otherUserId, 'appointment_status_updated', {
      appointmentId: String(appointment._id),
      status: 'cancelled',
      appointment: safePopulated,
    });

    await createNotificationsBatch([
      {
        userId: appointment.doctorId,
        type: 'appointment',
        title: 'Appointment Cancelled',
        message: `Appointment on ${new Date(populated.startTime).toLocaleString()} has been cancelled.`,
        relatedId: appointment._id,
      },
      {
        userId: appointment.patientId,
        type: 'appointment',
        title: 'Appointment Cancelled',
        message: `Appointment on ${new Date(populated.startTime).toLocaleString()} has been cancelled.`,
        relatedId: appointment._id,
      },
    ]);

    return sendResponse(res, 200, true, 'Appointment cancelled', safePopulated);
  } catch (error) {
    console.error('Cancel appointment error:', error);
    return sendResponse(res, 500, false, error.message || 'Error cancelling appointment');
  }
};

export const completeAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return sendResponse(res, 404, false, 'Appointment not found');
    }

    await expireNoShowAppointmentIfNeeded(appointment);

    const isParticipant =
      String(req.user._id) === String(appointment.doctorId) ||
      String(req.user._id) === String(appointment.patientId);

    if (!isParticipant) {
      return sendResponse(res, 403, false, 'Only appointment participants can complete this appointment');
    }

    if (appointment.status !== 'confirmed') {
      return sendResponse(res, 400, false, 'Only confirmed appointments can be marked completed');
    }

    if (!appointment.hasJoined) {
      return sendResponse(res, 400, false, 'Meeting must be joined before ending consultation');
    }

    appointment.status = 'completed';
    appointment.isMeetingCompleted = true;
    appointment.endedBy = req.user.role === 'doctor' ? 'doctor' : 'patient';
    await appointment.save();

    const populated = await Appointment.findById(id)
      .populate('doctorId', 'name email specialization')
      .populate('patientId', 'name email')
      .lean();

    const safePopulated = sanitizeAppointment(populated);

    emitToUser(String(appointment.patientId), 'appointment_status_updated', {
      appointmentId: String(appointment._id),
      status: 'completed',
      appointment: safePopulated,
    });

    emitToUser(String(appointment.doctorId), 'appointment_status_updated', {
      appointmentId: String(appointment._id),
      status: 'completed',
      appointment: safePopulated,
    });

    if (appointment.endedBy === 'patient') {
      await createNotification({
        userId: appointment.patientId,
        type: 'appointment',
        title: 'Appointment Completed',
        message: `Your appointment on ${new Date(populated.startTime).toLocaleString()} has been marked as completed. Please rate your consultation.`,
        relatedId: appointment._id,
      });
    }

    return sendResponse(res, 200, true, 'Appointment marked as completed', safePopulated);
  } catch (error) {
    console.error('Complete appointment error:', error);
    return sendResponse(res, 500, false, error.message || 'Error completing appointment');
  }
};
