import Review from '../models/Review.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import { sendResponse } from '../utils/response.js';

// Add review
export const addReview = async (req, res) => {
  try {
    const { appointmentId, doctorId, rating, comment = '' } = req.body;
    const patientId = req.user._id;

    // Validate inputs
    if (!appointmentId || !doctorId || !rating) {
      return sendResponse(res, 400, false, 'Please provide appointmentId, doctorId and rating');
    }

    if (rating < 1 || rating > 5) {
      return sendResponse(res, 400, false, 'Rating must be between 1 and 5');
    }

    // Check if user is patient
    if (req.user.role !== 'patient') {
      return sendResponse(res, 403, false, 'Only patients can submit reviews');
    }

    // Check if doctor exists and is verified
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor' || !doctor.isVerified) {
      return sendResponse(res, 404, false, 'Doctor not found');
    }

    // Check appointment is valid and belongs to this patient and doctor
    const appointment = await Appointment.findById(appointmentId).lean();
    if (!appointment) {
      return sendResponse(res, 404, false, 'Appointment not found');
    }

    if (String(appointment.patientId) !== String(patientId)) {
      return sendResponse(res, 403, false, 'You can only review your own appointment');
    }

    if (String(appointment.doctorId) !== String(doctorId)) {
      return sendResponse(res, 400, false, 'doctorId does not match appointment doctor');
    }

    if (
      appointment.status !== 'completed' ||
      !appointment.isMeetingCompleted ||
      appointment.endedBy !== 'patient'
    ) {
      return sendResponse(
        res,
        400,
        false,
        'Review is allowed only for consultations completed by patient after meeting'
      );
    }

    // Check for existing review
    const existingReview = await Review.findOne({ appointmentId, patientId });
    if (existingReview) {
      return sendResponse(res, 400, false, 'You have already reviewed this appointment');
    }

    // Create review
    const review = await Review.create({
      appointmentId,
      patientId,
      doctorId,
      rating,
      comment: comment?.trim() || '',
    });

    return sendResponse(res, 201, true, 'Review added successfully', review);
  } catch (error) {
    console.error('Add review error:', error);
    if (error?.code === 11000) {
      return sendResponse(res, 400, false, 'You have already reviewed this appointment');
    }
    return sendResponse(res, 500, false, error.message || 'Error adding review');
  }
};

export const getPendingRatingsForMe = async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return sendResponse(res, 403, false, 'Only patients can access pending ratings');
    }

    const completedAppointments = await Appointment.find({
      patientId: req.user._id,
      status: 'completed',
      isMeetingCompleted: true,
      endedBy: 'patient',
    })
      .populate('doctorId', 'name email specialization')
      .sort({ endTime: -1 })
      .lean();

    const appointmentIds = completedAppointments.map((appointment) => appointment._id);
    const existingReviews = await Review.find({
      appointmentId: { $in: appointmentIds },
      patientId: req.user._id,
    })
      .select('appointmentId')
      .lean();

    const reviewedAppointmentIds = new Set(
      existingReviews.map((review) => String(review.appointmentId))
    );

    const pendingRatings = completedAppointments.filter(
      (appointment) => !reviewedAppointmentIds.has(String(appointment._id))
    );

    return sendResponse(res, 200, true, 'Pending ratings fetched', pendingRatings);
  } catch (error) {
    console.error('Get pending ratings error:', error);
    return sendResponse(res, 500, false, error.message || 'Error fetching pending ratings');
  }
};

// Get doctor reviews
export const getDoctorReviews = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Check if doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return sendResponse(res, 404, false, 'Doctor not found');
    }

    // Get reviews
    const reviews = await Review.find({ doctorId })
      .populate('patientId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const averageRating =
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    return sendResponse(res, 200, true, 'Reviews fetched successfully', {
      reviews,
      averageRating: parseFloat(averageRating),
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error('Get doctor reviews error:', error);
    return sendResponse(res, 500, false, error.message || 'Error fetching reviews');
  }
};
