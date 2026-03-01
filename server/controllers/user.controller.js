const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/password');
const { logActivity } = require('../middleware/logger');
const { getCached, invalidateCache } = require('../config/redis');

async function getProfile(req, res, next) {
  try {
    const cacheKey = `user:profile:${req.user.userId}`;
    const data = await getCached(cacheKey, async () => {
      const user = await User.findById(req.user.userId);
      if (!user) return null;
      return {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        isVerified: user.is_verified,
        twoFactorEnabled: user.two_factor_enabled || false,
        createdAt: user.created_at,
        lastLogin: user.last_login,
      };
    }, 600);

    if (!data) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { firstName, lastName, phone } = req.body;
    const updated = await User.updateProfile(req.user.userId, { firstName, lastName, phone });
    if (!updated) return res.status(404).json({ success: false, error: 'User not found' });

    await logActivity(req.user.userId, 'UPDATE_PROFILE', 'users', req.user.userId, req, 'success');
    await invalidateCache(`user:profile:${req.user.userId}`);

    res.json({
      success: true,
      data: {
        id: updated.id,
        email: updated.email,
        firstName: updated.first_name,
        lastName: updated.last_name,
        phone: updated.phone,
        role: updated.role,
      },
      message: 'Profile updated successfully',
    });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByEmail(req.user.email);

    const valid = await comparePassword(currentPassword, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    const passwordHash = await hashPassword(newPassword);
    await User.updatePassword(req.user.userId, passwordHash);
    await logActivity(req.user.userId, 'CHANGE_PASSWORD', 'users', req.user.userId, req, 'success');

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile, changePassword };
