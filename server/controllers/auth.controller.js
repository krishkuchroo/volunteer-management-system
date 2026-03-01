const db = require('../config/database');
const User = require('../models/User');
const VolunteerProfile = require('../models/VolunteerProfile');
const PasswordResetToken = require('../models/PasswordResetToken');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { logActivity } = require('../middleware/logger');
const emailService = require('../services/email.service');
const { detectBruteForce } = require('../services/siem.service');
const { generate2FASecret, verify2FAToken } = require('../utils/twoFactor');
const jwt = require('jsonwebtoken');

async function register(req, res, next) {
  const client = await db.getClient();
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;
    await client.query('BEGIN');

    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create(client, { email, passwordHash, role, firstName, lastName, phone });

    if (role === 'volunteer') {
      await VolunteerProfile.create(client, user.id);
    }

    await client.query('COMMIT');

    const token = generateToken(user);
    await logActivity(user.id, 'REGISTER', 'users', user.id, req, 'success');

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
        },
      },
      message: 'Registration successful',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);

    if (!user) {
      await logActivity(null, 'LOGIN_FAILED', 'auth', null, req, 'failure', { email });
      detectBruteForce(req.ip); // fire-and-forget
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, error: 'Account has been deactivated' });
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      await logActivity(user.id, 'LOGIN_FAILED', 'auth', null, req, 'failure');
      detectBruteForce(req.ip); // fire-and-forget
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    await User.updateLastLogin(user.id);

    // If 2FA is enabled, return a short-lived temp token instead of a full JWT
    if (user.two_factor_enabled) {
      const tempToken = jwt.sign(
        { userId: user.id, twoFactorPending: true },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );
      return res.json({
        success: true,
        data: { requiresTwoFactor: true, tempToken },
        message: 'Two-factor authentication required',
      });
    }

    const token = generateToken(user);
    await logActivity(user.id, 'LOGIN', 'auth', null, req, 'success');

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
        },
      },
      message: 'Login successful',
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    await logActivity(req.user.userId, 'LOGOUT', 'auth', null, req, 'success');
    res.json({ success: true, message: 'Logout successful' });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findByEmail(email);

    // Always return success to prevent email enumeration
    if (user && user.is_active) {
      const token = await PasswordResetToken.create(user.id);
      await emailService.sendPasswordResetEmail(user.email, token);
      await logActivity(user.id, 'FORGOT_PASSWORD', 'auth', null, req, 'success');
    }

    res.json({ success: true, message: 'If that email exists, a reset link has been sent' });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    const resetToken = await PasswordResetToken.findValid(token);

    if (!resetToken) {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
    }

    const passwordHash = await hashPassword(newPassword);
    await User.updatePassword(resetToken.user_id, passwordHash);
    await PasswordResetToken.markUsed(resetToken.id);
    await logActivity(resetToken.user_id, 'RESET_PASSWORD', 'auth', null, req, 'success');

    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    next(err);
  }
}

// POST /auth/2fa/setup — generate secret + QR code (authenticated, not yet enabled)
async function setup2FA(req, res, next) {
  try {
    const user = await User.findByIdWithSecret(req.user.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    if (user.two_factor_enabled) {
      return res.status(400).json({ success: false, error: '2FA is already enabled' });
    }

    const { secret, qrCode } = await generate2FASecret(user.email);
    // Store secret temporarily (not yet enabled until user confirms)
    await User.update2FA(user.id, { secret, enabled: false });

    res.json({ success: true, data: { qrCode, secret }, message: 'Scan QR code with your authenticator app' });
  } catch (err) {
    next(err);
  }
}

// POST /auth/2fa/enable — verify token and enable 2FA
async function enable2FA(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, error: 'TOTP token required' });

    const user = await User.findByIdWithSecret(req.user.userId);
    if (!user?.two_factor_secret) {
      return res.status(400).json({ success: false, error: 'Run 2FA setup first' });
    }
    if (user.two_factor_enabled) {
      return res.status(400).json({ success: false, error: '2FA is already enabled' });
    }

    const valid = verify2FAToken(user.two_factor_secret, token);
    if (!valid) return res.status(401).json({ success: false, error: 'Invalid TOTP token' });

    await User.update2FA(user.id, { secret: user.two_factor_secret, enabled: true });
    await logActivity(req.user.userId, 'ENABLE_2FA', 'users', req.user.userId, req, 'success');

    res.json({ success: true, message: '2FA enabled successfully' });
  } catch (err) {
    next(err);
  }
}

// POST /auth/2fa/disable — verify token and disable 2FA
async function disable2FA(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, error: 'TOTP token required' });

    const user = await User.findByIdWithSecret(req.user.userId);
    if (!user?.two_factor_enabled) {
      return res.status(400).json({ success: false, error: '2FA is not enabled' });
    }

    const valid = verify2FAToken(user.two_factor_secret, token);
    if (!valid) return res.status(401).json({ success: false, error: 'Invalid TOTP token' });

    await User.update2FA(user.id, { secret: null, enabled: false });
    await logActivity(req.user.userId, 'DISABLE_2FA', 'users', req.user.userId, req, 'success');

    res.json({ success: true, message: '2FA disabled successfully' });
  } catch (err) {
    next(err);
  }
}

// POST /auth/2fa/verify — exchange tempToken + TOTP code for full JWT
async function verify2FA(req, res, next) {
  try {
    const { tempToken, token } = req.body;
    if (!tempToken || !token) {
      return res.status(400).json({ success: false, error: 'tempToken and token required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid or expired temp token' });
    }

    if (!decoded.twoFactorPending) {
      return res.status(401).json({ success: false, error: 'Invalid temp token' });
    }

    const user = await User.findByIdWithSecret(decoded.userId);
    if (!user?.two_factor_enabled || !user.two_factor_secret) {
      return res.status(400).json({ success: false, error: '2FA not configured' });
    }

    const valid = verify2FAToken(user.two_factor_secret, token);
    if (!valid) return res.status(401).json({ success: false, error: 'Invalid TOTP token' });

    const fullUser = await User.findById(user.id);
    const fullToken = generateToken(fullUser);
    await logActivity(user.id, 'LOGIN', 'auth', null, req, 'success');

    res.json({
      success: true,
      data: {
        token: fullToken,
        user: {
          id: fullUser.id,
          email: fullUser.email,
          firstName: fullUser.first_name,
          lastName: fullUser.last_name,
          role: fullUser.role,
        },
      },
      message: 'Login successful',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, forgotPassword, resetPassword, setup2FA, enable2FA, disable2FA, verify2FA };
