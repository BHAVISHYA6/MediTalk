import Payment from '../models/Payment.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import { sendResponse } from '../utils/response.js';
import { createNotification } from '../services/notificationService.js';
import { emitToUser } from '../socket/socketHandler.js';

// Initiate payment for appointment
export const initiatePayment = async (req, res) => {
  try {
    const { appointmentId, amount } = req.body;
    const patientId = req.user._id;

    if (!appointmentId || !amount) {
      return sendResponse(res, 400, false, 'Appointment ID and amount are required');
    }

    // Verify appointment exists and belongs to patient
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return sendResponse(res, 404, false, 'Appointment not found');
    }

    if (String(appointment.patientId) !== String(patientId)) {
      return sendResponse(res, 403, false, 'You can only pay for your own appointment');
    }

    if (appointment.status !== 'completed') {
      return sendResponse(res, 400, false, 'Payment can only be made after appointment completion');
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ appointmentId });
    if (existingPayment && existingPayment.status === 'completed') {
      return sendResponse(res, 400, false, 'Payment already completed for this appointment');
    }

    // Create or update payment record
    let payment = existingPayment || new Payment();
    payment.appointmentId = appointmentId;
    payment.patientId = patientId;
    payment.doctorId = appointment.doctorId;
    payment.amount = amount;
    payment.status = 'pending';

    await payment.save();

    return sendResponse(res, 201, true, 'Payment initiated', {
      paymentId: payment._id,
      appointmentId: payment.appointmentId,
      amount: payment.amount,
      status: payment.status,
    });
  } catch (error) {
    console.error('Initiate payment error:', error);
    return sendResponse(res, 500, false, error.message || 'Error initiating payment');
  }
};

// Process payment (mock - no real payment gateway)
export const processPayment = async (req, res) => {
  try {
    const { paymentId, cardDetails } = req.body;
    const patientId = req.user._id;

    if (!paymentId || !cardDetails) {
      return sendResponse(res, 400, false, 'Payment ID and card details are required');
    }

    const { cardNumber, expiryDate, cvv } = cardDetails;
    if (!cardNumber || !expiryDate || !cvv) {
      return sendResponse(res, 400, false, 'All card details are required');
    }

    // Validate card number format (basic)
    if (!/^\d{13,19}$/.test(cardNumber.replace(/\s/g, ''))) {
      return sendResponse(res, 400, false, 'Invalid card number');
    }

    // Find payment
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return sendResponse(res, 404, false, 'Payment not found');
    }

    if (String(payment.patientId) !== String(patientId)) {
      return sendResponse(res, 403, false, 'You can only process your own payment');
    }

    if (payment.status !== 'pending') {
      return sendResponse(res, 400, false, 'This payment has already been processed');
    }

    // Mock payment processing - success
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const cardLastFour = cardNumber.slice(-4);

    payment.status = 'completed';
    payment.transactionId = transactionId;
    payment.cardLastFour = cardLastFour;
    await payment.save();

    // Get appointment and doctor details
    const appointment = await Appointment.findById(payment.appointmentId);
    const doctor = await User.findById(payment.doctorId);

    // Create notification for patient
    await createNotification({
      userId: patientId,
      type: 'system',
      title: 'Payment Successful',
      message: `Payment of $${payment.amount} for consultation with Dr. ${doctor.name} completed successfully. Transaction ID: ${transactionId}`,
      relatedId: payment.appointmentId,
    });

    // Create notification for doctor
    await createNotification({
      userId: payment.doctorId,
      type: 'system',
      title: 'Payment Received',
      message: `Payment of $${payment.amount} received from patient. You can now submit the prescription.`,
      relatedId: payment.appointmentId,
    });

    // Emit notification to doctor
    emitToUser(String(payment.doctorId), 'payment_completed', {
      paymentId: payment._id,
      appointmentId: payment.appointmentId,
      amount: payment.amount,
      patientId: payment.patientId,
      transactionId,
    });

    return sendResponse(res, 200, true, 'Payment processed successfully', {
      paymentId: payment._id,
      transactionId,
      status: 'completed',
      receipt: {
        amount: payment.amount,
        date: payment.updatedAt,
        transactionId,
        cardLastFour,
      },
    });
  } catch (error) {
    console.error('Process payment error:', error);
    return sendResponse(res, 500, false, error.message || 'Error processing payment');
  }
};

// Get payment details
export const getPaymentDetails = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user._id;

    const payment = await Payment.findOne({ appointmentId });
    if (!payment) {
      return sendResponse(res, 404, false, 'Payment not found');
    }

    // Verify user is either patient or doctor
    const isAuthorized =
      String(payment.patientId) === String(userId) ||
      String(payment.doctorId) === String(userId);

    if (!isAuthorized) {
      return sendResponse(res, 403, false, 'You do not have permission to view this payment');
    }

    return sendResponse(res, 200, true, 'Payment details fetched', payment);
  } catch (error) {
    console.error('Get payment details error:', error);
    return sendResponse(res, 500, false, error.message || 'Error fetching payment details');
  }
};

// Get payment status
export const getPaymentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user._id;

    const payment = await Payment.findOne({ appointmentId });
    if (!payment) {
      return sendResponse(res, 200, true, 'No payment found', { status: 'not_initiated' });
    }

    // Verify user is either patient or doctor
    const isAuthorized =
      String(payment.patientId) === String(userId) ||
      String(payment.doctorId) === String(userId);

    if (!isAuthorized) {
      return sendResponse(res, 403, false, 'You do not have permission to view this payment');
    }

    return sendResponse(res, 200, true, 'Payment status fetched', {
      status: payment.status,
      amount: payment.amount,
      transactionId: payment.transactionId || null,
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    return sendResponse(res, 500, false, error.message || 'Error fetching payment status');
  }
};
