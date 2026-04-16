import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { sendResponse } from '../utils/response.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, specialization, experience, consultationFee, standoutReason } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return sendResponse(res, 400, false, 'Please provide all required fields');
    }

    // Validate doctor-specific fields
    if (role === 'doctor') {
      if (!specialization || !standoutReason) {
        return sendResponse(
          res,
          400,
          false,
          'Please provide specialization and reason for standing out'
        );
      }

      if (!req.file) {
        return sendResponse(res, 400, false, 'Please upload certification document');
      }
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendResponse(res, 400, false, 'Email already registered');
    }

    // Prepare user data
    const userData = {
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'patient',
    };

    // Add doctor-specific fields if role is doctor
    if (role === 'doctor') {
      userData.specialization = specialization;
      userData.experience = experience || 0;
      userData.consultationFee = consultationFee ? Number(consultationFee) : 500;
      userData.standoutReason = standoutReason;
      userData.certificationFile = `/uploads/${req.file.filename}`;
      userData.verificationStatus = 'pending';
      userData.isVerified = false;
    }

    // Create new user
    const user = await User.create(userData);

    // Generate token
    const token = generateToken(user._id, user.role);

    // Set secure HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    console.log('🍪 Cookie set for register');

    // Return response
    const responseData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    if (role === 'doctor') {
      return sendResponse(
        res,
        201,
        true,
        'Doctor account created! Your account is under review by admin.',
        {
          user: responseData,
          verificationStatus: 'pending',
        }
      );
    }

    return sendResponse(res, 201, true, 'User registered successfully', {
      user: responseData,
    });
  } catch (error) {
    console.error('Register error:', error);
    return sendResponse(
      res,
      500,
      false,
      error.message || 'Error registering user'
    );
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return sendResponse(res, 400, false, 'Please provide email and password');
    }

    // Find user and include password field
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password'
    );

    if (!user) {
      return sendResponse(res, 401, false, 'Invalid email or password');
    }

    // Compare passwords
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return sendResponse(res, 401, false, 'Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      return sendResponse(
        res,
        403,
        false,
        'Your account has been deactivated. Please contact support.'
      );
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    // Set secure HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return response
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return sendResponse(res, 200, true, 'Login successful', {
      user: userData,
    });
  } catch (error) {
    console.error('Login error:', error);
    return sendResponse(res, 500, false, error.message || 'Error logging in');
  }
};

export const logout = async (req, res, next) => {
  try {
    res.clearCookie('token');
    return sendResponse(res, 200, true, 'Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
    return sendResponse(res, 500, false, error.message || 'Error logging out');
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    // req.user is set by authenticate middleware
    const user = await User.findById(req.user._id).select('-password');
    
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      verificationStatus: user.verificationStatus,
      isVerified: user.isVerified,
      specialization: user.specialization,
      experience: user.experience,
    };

    return sendResponse(res, 200, true, 'User data fetched', userData);
  } catch (error) {
    console.error('Get current user error:', error);
    return sendResponse(res, 500, false, error.message || 'Error fetching user data');
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return sendResponse(res, 404, false, 'User not found');
    }

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      specialization: user.specialization || null,
      experience: user.experience || 0,
    };

    return sendResponse(res, 200, true, 'User data fetched', userData);
  } catch (error) {
    console.error('Get user by ID error:', error);
    return sendResponse(res, 500, false, error.message || 'Error fetching user data');
  }
};
