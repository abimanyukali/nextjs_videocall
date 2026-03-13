import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    let token;

    token = req.cookies.accessToken;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.userId).select('-password');
            next();
        } catch (error) {
            console.error('AccessToken error:', error.message);
            res.status(401).json({ message: 'Token expired or invalid', code: 'TOKEN_EXPIRED' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};
