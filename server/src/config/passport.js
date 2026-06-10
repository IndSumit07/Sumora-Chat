import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import logger from './logger.js';

const generateUniqueUsername = async (displayName) => {
  const base = displayName
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 15);

  let username = base || 'user';
  let counter = 0;

  while (true) {
    const candidate = counter === 0 ? username : `${username}${counter}`;
    const existing = await User.findOne({ username: candidate });
    if (!existing) return candidate;
    counter++;
    if (counter > 9999) {
      username = `user${Date.now()}`;
      counter = 0;
    }
  }
};

const configurePassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
        passReqToCallback: false,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const googleId = profile.id;
          const fullName = profile.displayName;
          const avatar = profile.photos?.[0]?.value;

          if (!email) {
            return done(new Error('Google account has no email'), null);
          }

          // Try to find by googleId first
          let user = await User.findOne({ googleId });

          if (!user) {
            // Try to find by email (existing non-Google account)
            user = await User.findOne({ email, isDeleted: { $ne: true } });

            if (user) {
              // Link Google to existing account
              user.googleId = googleId;
              user.isGoogleAuth = true;
              if (!user.avatar && avatar) user.avatar = avatar;
              await user.save();
              logger.info(`Google account linked to existing user: ${email}`);
            } else {
              // Create new user
              const username = await generateUniqueUsername(fullName);
              user = await User.create({
                fullName,
                username,
                email,
                googleId,
                isGoogleAuth: true,
                isVerified: true,
                hasPassword: false,
                avatar: avatar || null,
              });
              logger.info(`New user created via Google OAuth: ${email}`);
            }
          }

          return done(null, user);
        } catch (err) {
          logger.error(`Google OAuth strategy error: ${err.message}`);
          return done(err, null);
        }
      }
    )
  );

  // We use JWT, not sessions, so no serializeUser/deserializeUser needed
  // but passport requires them if session is used — we disable session in the route
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id).select('-password');
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};

export default configurePassport;
