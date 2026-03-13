import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/auth/callback/google`,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const { id, displayName, emails, photos } = profile;
                const email = emails[0].value;
                const picture = photos[0]?.value;

                let user = await User.findOne({ email });

                if (!user) {
                    user = await User.create({
                        name: displayName,
                        email,
                        googleId: id,
                        profilePicture: picture,
                    });
                } else {
                    // Update details if necessary
                    if (!user.googleId) user.googleId = id;
                    if (!user.profilePicture && picture) user.profilePicture = picture;
                    user.lastLogin = Date.now();
                    await user.save();
                }

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

export default passport;
