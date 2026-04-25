import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './env.js';
import { UserModel } from '../modules/users/user.model.js';
import { logger } from '../utils/logger.js';

const googleOAuthEnabled = !!(
  env.GOOGLE_CLIENT_ID &&
  env.GOOGLE_CLIENT_SECRET &&
  env.GOOGLE_CALLBACK_URL
);

/**
 * Initialise Passport with Google OAuth strategy.
 * Skips setup entirely if Google env vars are not configured.
 */
export function initPassport(): void {
  if (!googleOAuthEnabled) {
    logger.warn('⚠️  Google OAuth not configured — skipping Passport setup');
    return;
  }

  const strategy = new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID!,
      clientSecret: env.GOOGLE_CLIENT_SECRET!,
      callbackURL: env.GOOGLE_CALLBACK_URL!,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email returned from Google'), false);
        }

        // Upsert: find existing or create new user
        let user = await UserModel.findOne({ email: email.toLowerCase() });

        if (user) {
          // Link Google ID if not already set
          if (!user.googleId) {
            user.googleId = profile.id;
            if (!user.avatarUrl && profile.photos?.[0]?.value) {
              user.avatarUrl = profile.photos[0].value;
            }
            await user.save();
          }
        } else {
          user = await UserModel.create({
            email: email.toLowerCase(),
            name: profile.displayName || email.split('@')[0],
            googleId: profile.id,
            avatarUrl: profile.photos?.[0]?.value,
            role: 'user',
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err as Error, false);
      }
    },
  );

  passport.use(strategy);

  // Minimal serialize/deserialize (we use stateless JWTs, not sessions)
  passport.serializeUser((user: any, done) => {
    done(null, user._id?.toString());
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await UserModel.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  logger.info('✅  Google OAuth strategy registered');
}

export { googleOAuthEnabled };
export default passport;
