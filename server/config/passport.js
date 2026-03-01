const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const db = require('./database');
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('No email from Google profile'));

        // Find existing user
        let user = await User.findByEmail(email);

        if (!user) {
          // Create new volunteer user (Google-authenticated users are pre-verified)
          const client = await db.getClient();
          try {
            await client.query('BEGIN');
            const result = await client.query(
              `INSERT INTO users (email, password_hash, role, first_name, last_name, is_verified)
               VALUES ($1, $2, 'volunteer', $3, $4, true)
               RETURNING id, email, role, first_name, last_name`,
              [
                email,
                'GOOGLE_OAUTH_NO_PASSWORD',
                profile.name?.givenName || profile.displayName || '',
                profile.name?.familyName || '',
              ]
            );
            const newUser = result.rows[0];
            await client.query(
              'INSERT INTO volunteer_profiles (user_id) VALUES ($1)',
              [newUser.id]
            );
            await client.query('COMMIT');
            user = newUser;
          } catch (err) {
            await client.query('ROLLBACK');
            throw err;
          } finally {
            client.release();
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

module.exports = passport;
