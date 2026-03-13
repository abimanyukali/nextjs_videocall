import User from '../models/User.js';
import CallLog from '../models/CallLog.js';

// @desc    Get Platform Statistics
// @route   GET /api/stats
// @access  Private (or Public depending on requirement)
export const getPlatformStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();

        // Active users: let's say anyone logged in within the last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const activeUsers = await User.countDocuments({ lastLogin: { $gte: oneDayAgo } });

        const totalCalls = await CallLog.countDocuments();

        // Average call duration (only count calls that ended and have duration)
        const callsWithDuration = await CallLog.find({ duration: { $exists: true } });
        let totalDuration = 0;
        callsWithDuration.forEach(call => {
            totalDuration += call.duration;
        });
        const averageCallDuration = callsWithDuration.length > 0 ? Math.round(totalDuration / callsWithDuration.length) : 0;

        res.json({
            totalUsers,
            activeUsers,
            totalCalls,
            averageCallDuration
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
