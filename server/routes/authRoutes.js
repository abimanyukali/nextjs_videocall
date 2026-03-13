import express from 'express';
import { check } from 'express-validator';
import {
  registerUser,
  loginUser,
  googleAuthCallback,
  logoutUser,
  verifyAge,
  getUserProfile,
  verifyEmail,
  forgotPassword,
  resetPassword,
  refreshToken,
  resendVerificationEmail
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters',
    ).isLength({ min: 6 }),
  ],
  validate,
  registerUser,
);

router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  validate,
  loginUser,
);

// Email verification & Password Reset Routes
router.get('/verify-email', verifyEmail);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

import passport from 'passport';

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }),
);

router.get(
  '/callback/google',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL}/auth/login`,
    session: false,
  }),
  googleAuthCallback,
);

router.post('/logout', logoutUser);

router.route('/profile').get(protect, getUserProfile);
router.route('/verify-age').put(protect, verifyAge);

router.post('/refresh-token', refreshToken);
router.post('/resend-verification', protect, resendVerificationEmail);

export default router;
