import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from './db.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback';

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          const googleId = profile.id;
          const name = profile.displayName || 'Google User';

          if (!email) {
            return done(new Error('Google account email is required'));
          }

          // 1) If googleId exists, this is a returning Google login.
          const existingByGoogleId = await prisma.user.findUnique({
            where: { googleId },
          });

          if (existingByGoogleId) {
            const user =
              existingByGoogleId.isVerified
                ? existingByGoogleId
                : await prisma.user.update({
                    where: { id: existingByGoogleId.id },
                    data: { isVerified: true },
                  });

            return done(null, user);
          }

          // 2) If email exists with no googleId, link the account.
          const existingByEmail = await prisma.user.findUnique({
            where: { email },
          });

          if (existingByEmail) {
            if (existingByEmail.googleId && existingByEmail.googleId !== googleId) {
              return done(new Error('Email is already linked to a different Google account'));
            }

            const user = await prisma.user.update({
              where: { id: existingByEmail.id },
              data: {
                googleId,
                isVerified: true,
              },
            });

            return done(null, user);
          }

          // 3) If no matching googleId/email user exists, create a new account.
          const user = await prisma.user.create({
            data: {
              name,
              email,
              password: null,
              googleId,
              isVerified: true,
            },
          });

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      },
    ),
  );
} else {
  console.warn(
    'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable passport-google-oauth20.',
  );
}

export default passport;
