import Appointment from '../models/Appointment.js';
import { isNoShowExpired } from '../utils/time.js';

const ACTIVE_STATUSES = ['pending', 'confirmed'];

export const hasDoctorConflict = async (doctorId, startTime, endTime, excludeId = null) => {
  const query = {
    doctorId,
    status: { $in: ACTIVE_STATUSES },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const conflict = await Appointment.findOne(query).lean();
  return Boolean(conflict);
};

export const createAppointmentRecord = async ({
  doctorId,
  patientId,
  proposedTime,
  duration,
  createdVia = 'chat',
  notes = '',
  meetingLink = '',
}) => {
  const startTime = new Date(proposedTime);
  const durationMinutes = Number(duration);

  if (Number.isNaN(startTime.getTime())) {
    throw new Error('Invalid proposed time');
  }

  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0 || durationMinutes > 720) {
    throw new Error('Duration must be a valid number of minutes');
  }

  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  const isConflict = await hasDoctorConflict(doctorId, startTime, endTime);
  if (isConflict) {
    const conflictError = new Error('Doctor already has an appointment in this time slot');
    conflictError.statusCode = 409;
    throw conflictError;
  }

  const appointment = await Appointment.create({
    doctorId,
    patientId,
    startTime,
    endTime,
    status: 'pending',
    createdVia,
    notes,
    meetingLink,
  });

  return appointment;
};

export const expireNoShowAppointmentIfNeeded = async (appointmentDoc) => {
  if (!appointmentDoc) return appointmentDoc;
  if (!isNoShowExpired(appointmentDoc)) return appointmentDoc;

  appointmentDoc.status = 'cancelled';
  appointmentDoc.cancellationReason = 'no_show';
  await appointmentDoc.save();
  return appointmentDoc;
};

export const expireNoShowAppointmentsForUser = async (user) => {
  const userQuery = user.role === 'doctor' ? { doctorId: user._id } : { patientId: user._id };

  await Appointment.updateMany(
    {
      ...userQuery,
      status: 'confirmed',
      hasJoined: false,
      endTime: { $lt: new Date(Date.now() - 15 * 60 * 1000) },
    },
    {
      $set: {
        status: 'cancelled',
        cancellationReason: 'no_show',
      },
    }
  );
};

export const getAppointmentsForUser = async (user) => {
  await expireNoShowAppointmentsForUser(user);

  const query = user.role === 'doctor' ? { doctorId: user._id } : { patientId: user._id };

  return Appointment.find(query)
    .populate('doctorId', 'name email specialization')
    .populate('patientId', 'name email')
    .sort({ startTime: -1 })
    .lean();
};
