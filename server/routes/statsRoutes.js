import express from 'express';
import { getPlatformStats } from '../controllers/statsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/').get(getPlatformStats);

export default router;
