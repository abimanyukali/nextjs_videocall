import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create a Razorpay order for ₹100 (24h premium)
// @route   POST /api/payment/create-order
// @access  Private
export const createOrder = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay keys missing in .env');
      return res
        .status(500)
        .json({ message: 'Payment gateway not configured' });
    }
    const options = {
      amount: 10000, // ₹100 in paise
      currency: 'INR',
      receipt: `rcpt_${req.user._id.toString().slice(-8)}_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        plan: 'premium_24h',
      },
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      userName: req.user.name,
      userEmail: req.user.email,
    });
  } catch (error) {
    console.error('Razorpay create order error:', error);
    res.status(500).json({
      message: 'Failed to create payment order',
      error: error.message,
    });
  }
};

// @desc    Verify Razorpay payment & activate premium
// @route   POST /api/payment/verify
// @access  Private
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res
        .status(400)
        .json({ message: 'Missing payment verification fields' });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ message: 'Invalid payment signature. Payment not verified.' });
    }

    // Activate 24h premium
    const now = new Date();
    const premiumExpiry = new Date(now.getTime() + 1 * 60 * 60 * 1000); // +24 hours

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        isPremium: true,
        premiumExpiry,
      },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Payment verified. Premium activated for 24 hours!',
      isPremium: true,
      premiumExpiry,
    });
  } catch (error) {
    console.error('Razorpay verify payment error:', error);
    res
      .status(500)
      .json({ message: 'Payment verification failed', error: error.message });
  }
};

// @desc    Get current premium status
// @route   GET /api/payment/status
// @access  Private
export const getPremiumStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isActive =
      user.isPremium &&
      user.premiumExpiry &&
      new Date(user.premiumExpiry) > new Date();

    res.status(200).json({
      isPremium: isActive,
      premiumExpiry: user.premiumExpiry,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
