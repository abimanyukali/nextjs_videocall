import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String, // Store hashed password if email login, can be null for Google OAuth
            required: false,
        },
        googleId: {
            type: String, // Used for tracking google auth users
            required: false,
        },
        profilePicture: {
            type: String,
            default: '',
        },
        ageVerified: {
            type: Boolean,
            default: false,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        emailVerificationToken: String,
        emailTokenExpiry: Date,
        resetPasswordToken: String,
        resetPasswordExpire: Date,
        refreshToken: String, // Store the 15-day refresh token string here
        lastLogin: {
            type: Date,
            default: Date.now,
        },
        isPremium: {
            type: Boolean,
            default: false,
        },
        premiumExpiry: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model('User', userSchema);
export default User;
