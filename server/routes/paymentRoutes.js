import express from 'express';
import { createOrder, verifyPayment, getPremiumStatus } from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All payment routes require authentication
router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/status', protect, getPremiumStatus);

export default router;
