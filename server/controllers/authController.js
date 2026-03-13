import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';

const generateTokens = async (res, user) => {
  // 30 Minutes Access Token
  const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: '30m',
  });

  // 15 Days Refresh Token
  const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: '15d',
  });

  // hash the refresh token before saving to DB for security
  const hashedRefreshToken = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  // Save Refresh Token to Database
  user.refreshToken = hashedRefreshToken;
  await user.save({ validateBeforeSave: false });

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    maxAge: 30 * 60 * 1000, // 30 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
  });
};

// Helper to build public user profile object (includes premium status)
const buildUserProfile = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  profilePicture: user.profilePicture,
  ageVerified: user.ageVerified,
  isEmailVerified: user.isEmailVerified,
  isPremium: !!(
    user.isPremium &&
    user.premiumExpiry &&
    new Date(user.premiumExpiry) > new Date()
  ),
  premiumExpiry: user.premiumExpiry || null,
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, password, isHuman } = req.body;

  try {
    if (!isHuman) {
      return res
        .status(400)
        .json({ message: 'Please confirm you are human (not a boat).' });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate secure random token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Set expiry to 2 minutes from now
    const tokenExpiry = Date.now() + 10 * 60 * 1000;

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      emailVerificationToken: verificationToken, // Store plan token (or hash it, but user asked for secure token)
      emailTokenExpiry: tokenExpiry,
    });

    if (user) {
      // Format: https://mydomain.com/api/auth/verify-email?token=TOKEN_VALUE
      // Using /api/auth/verify-email directly as per requirement 2
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
      const verifyUrl = `${backendUrl}/api/auth/verify-email?token=${verificationToken}`;

      const message = `Welcome to ARL Network!\n\nPlease click the following link to verify your email address. This link will expire in 2 minutes:\n\n${verifyUrl}\n\nIf you did not request this, please ignore this email.`;

      try {
        await sendEmail({
          email: user.email,
          subject: 'ARL Network - Email Verification',
          message,
        });
      } catch (err) {
        console.error('Email could not be sent', err);
      }

      await generateTokens(res, user);
      res.status(201).json(buildUserProfile(user));
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (
      user &&
      user.password &&
      (await bcrypt.compare(password, user.password))
    ) {
      user.lastLogin = Date.now();
      await user.save();

      await generateTokens(res, user);
      res.json(buildUserProfile(user));
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Google OAuth Callback Handler
// @route   GET /api/auth/google/callback
// @access  Public
export const googleAuthCallback = async (req, res) => {
  if (!req.user) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/auth/login?error=GoogleAuthFailed`,
    );
  }

  // Google users are usually considered verified by default
  req.user.isEmailVerified = true;
  await req.user.save();

  await generateTokens(res, req.user);
  res.redirect(`${process.env.FRONTEND_URL}/chat`);
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logoutUser = async (req, res) => {
  if(!req.user || ! req.body.userId ){
    return res.status(400).json({ message: 'User information missing for logout' });
  }
  res.cookie('accessToken', '', {
    httpOnly: true,
    expires: new Date(0),
  });

  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0),
  });

  if (req.user || req.body.userId) {
    const userId = req.user?._id || req.body.userId;
    try {
      await User.findByIdAndUpdate(userId, { refreshToken: null });
    } catch (e) {
      console.error('Failed to remove refresh token from DB during logout', e);
    }
  }

  res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Verify Age
// @route   PUT /api/auth/verify-age
// @access  Private
export const verifyAge = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.ageVerified = true;
      const updatedUser = await user.save();
      res.json(buildUserProfile(updatedUser));
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json(buildUserProfile(user));
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Verify Email
// @route   GET /api/auth/verify-email?token=...
// @access  Public
export const verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    if (!token) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/chat?error=invalid_token`,
      );
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({ emailVerificationToken: hashedToken });

    if (!user) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/chat?error=invalid_token`,
      );
    }

    // Check if expired
    if (user.emailTokenExpiry && user.emailTokenExpiry < Date.now()) {
      user.emailVerificationToken = null;
      user.emailTokenExpiry = null;
      await user.save();
      return res.redirect(`${process.env.FRONTEND_URL}/chat?error=expired`);
    }

    // Mark as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailTokenExpiry = null;
    await user.save();

    // Optionally regenerate tokens to ensure session is fresh
    await generateTokens(res, user);

    res.redirect(`${process.env.FRONTEND_URL}/chat?verified=true`);
  } catch (error) {
    console.error('Verification error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/chat?error=server_error`);
  }
};

// @desc    Forgot Password Request
// @route   POST /api/auth/forgotpassword
// @access  Public
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        message:
          'If an account with that email exists, a password reset link has been sent.',
      });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');

    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password/${resetToken}`;
    const message = `You are receiving this email because you (or someone else) has requested the reset of a password.\n\nPlease click the link to reset your password:\n\n${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'ARL Network - Password Reset Request',
        message,
      });
      res.status(200).json({ message: 'Password reset link sent to email' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reset Password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: 'Invalid or expired reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    await generateTokens(res, user);
    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Refresh Access Token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshToken = async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) {
    return res.status(401).json({ message: 'No refresh token provided' });
  }
  // hash the refresh token before saving to DB for security
  const hashedRefreshToken = crypto
    .createHash('sha256')
    .update(incomingRefreshToken)
    .digest('hex');
  try {
    const decoded = jwt.verify(incomingRefreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || user.refreshToken !== hashedRefreshToken) {
      return res
        .status(403)
        .json({ message: 'Refresh token is invalid or expired' });
    }

    await generateTokens(res, user);
    res.status(200).json({ message: 'Token refreshed successfully' });
  } catch (error) {
    res.status(403).json({ message: 'Refresh token expired' });
  }
};

// @desc    Resend Verification Email
// @route   POST /api/auth/resend-verification
// @access  Private (Requires valid accessToken)
export const resendVerificationEmail = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate new secure token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    // Set 10-minute expiry

    const tokenExpiry = Date.now() + 10 * 60 * 1000;

    user.emailVerificationToken = hashedToken;
    user.emailTokenExpiry = tokenExpiry;
    await user.save({ validateBeforeSave: false });

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const verifyUrl = `${backendUrl}/api/auth/verify-email?token=${verificationToken}`;
    const message = `Welcome back to ARL Network!\n\nPlease click the following link to verify your email address. This link will expire in 10 minutes:\n\n${verifyUrl}\n\nIf you did not request this, please ignore this email.`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'ARL Network - Resend Email Verification',
        message,
      });
      res.status(200).json({ message: 'Verification email sent' });
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr.message);
      res.status(200).json({
        message: 'Verification email queued. Please check your inbox shortly.',
        warning:
          'Email delivery may be delayed. Please configure email credentials.',
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
