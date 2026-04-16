import Prescription from '../models/Prescription.js';
import Payment from '../models/Payment.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import { sendResponse } from '../utils/response.js';
import { createNotification } from '../services/notificationService.js';
import { emitToUser } from '../socket/socketHandler.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

// Create prescription (doctor only, after payment)
export const createPrescription = async (req, res) => {
  try {
    const { appointmentId, medicines, notes = '' } = req.body;
    const doctorId = req.user._id;

    if (!appointmentId) {
      return sendResponse(res, 400, false, 'Appointment ID is required');
    }

    if (!Array.isArray(medicines) || medicines.length === 0) {
      return sendResponse(res, 400, false, 'At least one medicine is required');
    }

    // Verify appointment exists and belongs to doctor
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return sendResponse(res, 404, false, 'Appointment not found');
    }

    if (String(appointment.doctorId) !== String(doctorId)) {
      return sendResponse(res, 403, false, 'Only the doctor can create prescription for this appointment');
    }

    // Check if appointment is completed
    if (appointment.status !== 'completed') {
      return sendResponse(res, 400, false, 'Prescription can only be created for completed appointments');
    }

    // Check if payment is completed
    const payment = await Payment.findOne({ appointmentId });
    if (!payment || payment.status !== 'completed') {
      return sendResponse(res, 400, false, 'Prescription can only be created after payment is completed');
    }

    // Validate medicines
    for (const medicine of medicines) {
      if (!medicine.name || !medicine.dosage || !medicine.frequency || !medicine.duration) {
        return sendResponse(res, 400, false, 'Each medicine must have name, dosage, frequency, and duration');
      }
    }

    // Check if prescription already exists
    let prescription = await Prescription.findOne({ appointmentId });
    if (prescription) {
      // Update existing prescription if in draft status
      if (prescription.status === 'draft') {
        prescription.medicines = medicines;
        prescription.notes = notes;
        prescription.status = 'submitted';
      } else {
        return sendResponse(res, 400, false, 'Prescription already submitted for this appointment');
      }
    } else {
      // Create new prescription
      prescription = await Prescription.create({
        appointmentId,
        patientId: appointment.patientId,
        doctorId,
        paymentId: payment._id,
        medicines,
        notes,
        status: 'submitted',
      });
    }

    await prescription.save();

    // Get patient details
    const patient = await User.findById(appointment.patientId);
    const doctor = await User.findById(doctorId);

    // Create prescription message for chat
    const prescriptionText = formatPrescriptionForChat(prescription, doctor);
    const prescriptionMessage = await Message.create({
      senderId: doctorId,
      receiverId: appointment.patientId,
      text: prescriptionText,
      messageType: 'prescription',
      metadata: {
        prescriptionId: prescription._id,
        appointmentId,
        medicines: medicines.map(m => ({
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          type: m.type || 'tablet',
          instructions: m.instructions || '',
        })),
        notes,
        submittedAt: new Date().toISOString(),
        status: 'submitted',
      },
    });

    // Update or create conversation
    const existingConversation = await Conversation.findOne({
      participants: { $all: [doctorId, appointment.patientId] },
    });

    if (existingConversation) {
      existingConversation.lastMessage = 'Prescription sent';
      existingConversation.lastMessageTime = new Date();
      await existingConversation.save();
    } else {
      await Conversation.create({
        participants: [doctorId, appointment.patientId],
        lastMessage: 'Prescription sent',
        lastMessageTime: new Date(),
      });
    }

    // Populate message
    const populatedMessage = await Message.findById(prescriptionMessage._id)
      .populate('senderId', 'name email role')
      .populate('receiverId', 'name email role');

    // Send notification to patient
    await createNotification({
      userId: appointment.patientId,
      type: 'system',
      title: 'Prescription Received',
      message: `Dr. ${doctor.name} has sent your prescription. Please review it in the chat.`,
      relatedId: prescription._id,
    });

    // Emit to patient in real-time
    emitToUser(String(appointment.patientId), 'prescription_received', {
      appointmentId,
      prescriptionId: prescription._id,
      message: populatedMessage,
    });

    emitToUser(String(appointment.patientId), 'receive_message', populatedMessage);

    return sendResponse(res, 201, true, 'Prescription submitted successfully', {
      prescription: {
        _id: prescription._id,
        appointmentId,
        medicines,
        notes,
        status: 'submitted',
      },
    });
  } catch (error) {
    console.error('Create prescription error:', error);
    return sendResponse(res, 500, false, error.message || 'Error creating prescription');
  }
};

// Get prescription details
export const getPrescription = async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const userId = req.user._id;

    const prescription = await Prescription.findById(prescriptionId)
      .populate('doctorId', 'name email specialization')
      .populate('patientId', 'name email');

    if (!prescription) {
      return sendResponse(res, 404, false, 'Prescription not found');
    }

    // Verify user is either patient or doctor
    const isAuthorized =
      String(prescription.patientId._id) === String(userId) ||
      String(prescription.doctorId._id) === String(userId);

    if (!isAuthorized) {
      return sendResponse(res, 403, false, 'You do not have permission to view this prescription');
    }

    // Mark as viewed if patient
    if (String(prescription.patientId._id) === String(userId) && prescription.status === 'submitted') {
      prescription.status = 'viewed';
      await prescription.save();
    }

    return sendResponse(res, 200, true, 'Prescription fetched', prescription);
  } catch (error) {
    console.error('Get prescription error:', error);
    return sendResponse(res, 500, false, error.message || 'Error fetching prescription');
  }
};

// Get prescription by appointment ID
export const getPrescriptionByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user._id;

    const prescription = await Prescription.findOne({ appointmentId });
    if (!prescription) {
      return sendResponse(res, 404, false, 'Prescription not found');
    }

    // Verify user is either patient or doctor
    const isAuthorized =
      String(prescription.patientId) === String(userId) ||
      String(prescription.doctorId) === String(userId);

    if (!isAuthorized) {
      return sendResponse(res, 403, false, 'You do not have permission to view this prescription');
    }

    return sendResponse(res, 200, true, 'Prescription fetched', prescription);
  } catch (error) {
    console.error('Get prescription by appointment error:', error);
    return sendResponse(res, 500, false, error.message || 'Error fetching prescription');
  }
};

// Helper function to format prescription for chat display
function formatPrescriptionForChat(prescription, doctor) {
  const medicinesText = prescription.medicines
    .map(
      (m) =>
        `• ${m.name} (${m.type})\n  Dosage: ${m.dosage}\n  Frequency: ${m.frequency}\n  Duration: ${m.duration}${
          m.instructions ? `\n  Instructions: ${m.instructions}` : ''
        }`
    )
    .join('\n\n');

  return `📋 PRESCRIPTION from Dr. ${doctor.name}\n\n${medicinesText}${
    prescription.notes ? `\n\nNotes: ${prescription.notes}` : ''
  }`;
}
