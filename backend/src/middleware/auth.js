import { verifyToken } from '../utils/jwt.js';
import { sendResponse, APIError } from '../utils/response.js';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    console.log('🔍 Auth Check - Cookies:', Object.keys(req.cookies || {}), 'Token:', !!token);

    if (!token) {
      return sendResponse(res, 401, false, 'No token generated, please login');
    }

    const decoded = verifyToken(token);
    console.log('✅ Token decoded:', decoded);
    
    if (!decoded) {
      console.log('❌ Token decode failed - Invalid or expired');
      return sendResponse(res, 401, false, 'Invalid or expired token');
    }

    // Get full user object from database
    console.log('🔎 Finding user with ID:', decoded.id);
    const user = await User.findById(decoded.id);
    console.log('👤 User found:', user ? user.email : 'NOT FOUND');
    
    if (!user) {
      console.log('❌ User not found in database');
      return sendResponse(res, 401, false, 'User not found');
    }

    req.user = user;
    console.log('✅ Authentication successful for:', user.role);
    next();
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    return sendResponse(res, 401, false, 'Authentication failed');
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendResponse(res, 401, false, 'Please authenticate first');
    }

    if (!roles.includes(req.user.role)) {
      return sendResponse(
        res,
        403,
        false,
        'You do not have permission to access this resource'
      );
    }

    next();
  };
};

// Check if doctor is verified
export const checkDoctorVerification = (req, res, next) => {
  if (!req.user) {
    return sendResponse(res, 401, false, 'User not authenticated');
  }

  if (req.user.role !== 'doctor') {
    return sendResponse(res, 403, false, 'Only doctors can access this resource');
  }

  if (req.user.verificationStatus !== 'approved') {
    return sendResponse(
      res,
      403,
      false,
      `Doctor account is ${req.user.verificationStatus}. Please wait for admin approval.`
    );
  }

  next();
};
