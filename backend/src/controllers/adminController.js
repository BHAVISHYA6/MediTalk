import User from '../models/User.js';
import { sendResponse } from '../utils/response.js';

// Get all pending doctors
export const getPendingDoctors = async (req, res) => {
  try {
    const doctors = await User.find({
      role: 'doctor',
      verificationStatus: 'pending',
    }).select('-password');

    return sendResponse(
      res,
      200,
      true,
      'Pending doctors fetched successfully',
      doctors
    );
  } catch (error) {
    console.error('Get pending doctors error:', error);
    return sendResponse(
      res,
      500,
      false,
      error.message || 'Error fetching pending doctors'
    );
  }
};

//hello

// Get all verified doctors
export const getVerifiedDoctors = async (req, res) => {
  try {
    const doctors = await User.find({
      role: 'doctor',
      verificationStatus: 'approved',
      isVerified: true,
    }).select('-password');

    return sendResponse(
      res,
      200,
      true,
      'Verified doctors fetched successfully',
      doctors
    );
  } catch (error) {
    console.error('Get verified doctors error:', error);
    return sendResponse(
      res,
      500,
      false,
      error.message || 'Error fetching verified doctors'
    );
  }
};

// Get single doctor details
export const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await User.findById(id).select('-password');

    if (!doctor) {
      return sendResponse(res, 404, false, 'Doctor not found');
    }

    if (doctor.role !== 'doctor') {
      return sendResponse(res, 400, false, 'User is not a doctor');
    }

    return sendResponse(
      res,
      200,
      true,
      'Doctor details fetched successfully',
      doctor
    );
  } catch (error) {
    console.error('Get doctor error:', error);
    return sendResponse(
      res,
      500,
      false,
      error.message || 'Error fetching doctor'
    );
  }
};

// Approve doctor
export const approveDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await User.findByIdAndUpdate(
      id,
      {
        verificationStatus: 'approved',
        isVerified: true,
        rejectionReason: null,
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!doctor) {
      return sendResponse(res, 404, false, 'Doctor not found');
    }

    return sendResponse(
      res,
      200,
      true,
      'Doctor approved successfully',
      doctor
    );
  } catch (error) {
    console.error('Approve doctor error:', error);
    return sendResponse(
      res,
      500,
      false,
      error.message || 'Error approving doctor'
    );
  }
};

// Reject doctor
export const rejectDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return sendResponse(
        res,
        400,
        false,
        'Please provide a rejection reason'
      );
    }

    const doctor = await User.findByIdAndUpdate(
      id,
      {
        verificationStatus: 'rejected',
        isVerified: false,
        rejectionReason: reason,
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!doctor) {
      return sendResponse(res, 404, false, 'Doctor not found');
    }

    return sendResponse(
      res,
      200,
      true,
      'Doctor rejected successfully',
      doctor
    );
  } catch (error) {
    console.error('Reject doctor error:', error);
    return sendResponse(
      res,
      500,
      false,
      error.message || 'Error rejecting doctor'
    );
  }
};

// Get admin dashboard stats
export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDoctors = await User.countDocuments({ role: 'doctor' });
    const pendingDoctors = await User.countDocuments({
      role: 'doctor',
      verificationStatus: 'pending',
    });
    const approvedDoctors = await User.countDocuments({
      role: 'doctor',
      verificationStatus: 'approved',
    });
    const totalPatients = await User.countDocuments({ role: 'patient' });

    const stats = {
      totalUsers,
      totalDoctors,
      pendingDoctors,
      approvedDoctors,
      totalPatients,
    };

    return sendResponse(
      res,
      200,
      true,
      'Admin stats fetched successfully',
      stats
    );
  } catch (error) {
    console.error('Get admin stats error:', error);
    return sendResponse(
      res,
      500,
      false,
      error.message || 'Error fetching admin stats'
    );
  }
};
