import User from '../models/User.js';
import Review from '../models/Review.js';
import { sendResponse } from '../utils/response.js';

// Get all approved doctors with filters
export const listDoctors = async (req, res) => {
  try {
    const { specialization, minRating, search, limit = 10, page = 1 } = req.query;

    // Build filter object
    let filter = {
      role: 'doctor',
      isVerified: true,
      verificationStatus: 'approved',
    };

    if (specialization) {
      filter.specialization = { $regex: specialization, $options: 'i' };
    }

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // Calculate skip for pagination
    const skipCount = (parseInt(page) - 1) * parseInt(limit);

    // Get doctors
    const doctors = await User.find(filter)
      .select('-password -certificationFile')
      .limit(parseInt(limit))
      .skip(skipCount)
      .lean();

    // Enrich with ratings
    const doctorsWithRatings = await Promise.all(
      doctors.map(async (doctor) => {
        const reviews = await Review.find({ doctorId: doctor._id });
        const averageRating =
          reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 0;

        return {
          ...doctor,
          averageRating: parseFloat(averageRating),
          totalReviews: reviews.length,
        };
      })
    );

    // Filter by minRating if provided
    let result = doctorsWithRatings;
    if (minRating) {
      result = doctorsWithRatings.filter((doc) => parseFloat(doc.averageRating) >= parseFloat(minRating));
    }

    // Get total count for pagination
    const totalDoctors = await User.countDocuments(filter);

    return sendResponse(res, 200, true, 'Doctors fetched successfully', {
      doctors: result,
      pagination: {
        total: totalDoctors,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalDoctors / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('List doctors error:', error);
    return sendResponse(res, 500, false, error.message || 'Error fetching doctors');
  }
};

// Get single doctor profile
export const getDoctorProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await User.findById(id)
      .select('-password')
      .lean();

    if (!doctor || doctor.role !== 'doctor' || !doctor.isVerified) {
      return sendResponse(res, 404, false, 'Doctor not found');
    }

    // Get reviews
    const reviews = await Review.find({ doctorId: id })
      .populate('patientId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const averageRating =
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    const profileData = {
      ...doctor,
      averageRating: parseFloat(averageRating),
      totalReviews: reviews.length,
      reviews: reviews,
    };

    return sendResponse(res, 200, true, 'Doctor profile fetched', profileData);
  } catch (error) {
    console.error('Get doctor profile error:', error);
    return sendResponse(res, 500, false, error.message || 'Error fetching doctor profile');
  }
};
