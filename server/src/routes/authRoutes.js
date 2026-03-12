const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

const User = require('../models/User');
const EmailVerificationCode = require('../models/EmailVerificationCode');
const AppSettings = require('../models/AppSettings');
const env = require('../config/env');
const { ApiError } = require('../utils/errors');
const { asyncHandler } = require('../utils/asyncHandler');
const { signAuthToken } = require('../services/tokenService');
const { sendEmailCode } = require('../services/emailService');
const {
  generateCode,
  hashCode,
  compareCode,
  CODE_TTL_MS,
  MAX_ATTEMPTS
} = require('../services/codeService');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

router.use(authLimiter);

function sanitizeUser(user) {
  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    userId: user.userId,
    email: user.email,
    mobile: user.mobile,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt
  };
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
}

async function createVerificationCode(user, purpose) {
  await EmailVerificationCode.deleteMany({ user: user._id, purpose, usedAt: null });

  const code = generateCode();
  const codeHash = await hashCode(code);
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  await EmailVerificationCode.create({
    user: user._id,
    email: user.email,
    codeHash,
    purpose,
    expiresAt
  });

  await sendEmailCode({ to: user.email, code, purpose });
}

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { firstName, lastName, userId, email, mobile, password } = req.body;

    if (!firstName || !lastName || !userId || !email || !password) {
      throw new ApiError(400, 'Missing required fields');
    }

    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { userId: userId.toLowerCase() }]
    });

    if (existing) {
      throw new ApiError(409, 'User with this email or user ID already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      firstName,
      lastName,
      userId: userId.toLowerCase(),
      email: email.toLowerCase(),
      mobile: mobile || '',
      passwordHash,
      emailVerified: false
    });

    await AppSettings.create({ user: user._id, timezone: env.appTz, defaultCurrency: 'INR' });

    await createVerificationCode(user, 'signup_verify');

    res.status(201).json({
      message: 'User registered. Verification code sent to email.',
      user: sanitizeUser(user)
    });
  })
);

router.post(
  '/verify-email',
  asyncHandler(async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
      throw new ApiError(400, 'Email and code are required');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const verification = await EmailVerificationCode.findOne({
      user: user._id,
      purpose: 'signup_verify',
      usedAt: null
    }).sort({ createdAt: -1 });

    if (!verification) {
      throw new ApiError(400, 'No verification code found');
    }

    if (verification.attempts >= MAX_ATTEMPTS) {
      throw new ApiError(429, 'Too many attempts. Request a new code.');
    }

    if (verification.expiresAt < new Date()) {
      throw new ApiError(400, 'Verification code has expired');
    }

    const match = await compareCode(code, verification.codeHash);
    if (!match) {
      verification.attempts += 1;
      await verification.save();
      throw new ApiError(400, 'Invalid verification code');
    }

    verification.usedAt = new Date();
    await verification.save();

    user.emailVerified = true;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      throw new ApiError(400, 'Identifier and password are required');
    }

    const normalized = identifier.toLowerCase();
    const user = await User.findOne({
      $or: [{ email: normalized }, { userId: normalized }]
    });

    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new ApiError(403, 'Please verify your email before logging in');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const token = signAuthToken(user._id.toString());
    res.cookie('auth_token', token, cookieOptions());

    res.json({ user: sanitizeUser(user) });
  })
);

router.post('/logout', (_req, res) => {
  res.clearCookie('auth_token', cookieOptions());
  res.json({ message: 'Logged out successfully' });
});

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const { verifyAuthToken } = require('../services/tokenService');
      const payload = verifyAuthToken(token);
      const user = await User.findById(payload.sub);
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      return res.json({ user: sanitizeUser(user) });
    } catch (_err) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  })
);

router.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
      throw new ApiError(400, 'Email is required');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      await createVerificationCode(user, 'password_reset');
    }

    res.json({ message: 'If the email exists, a reset code has been sent.' });
  })
);

router.post(
  '/verify-reset-code',
  asyncHandler(async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
      throw new ApiError(400, 'Email and code are required');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new ApiError(400, 'Invalid email or code');
    }

    const verification = await EmailVerificationCode.findOne({
      user: user._id,
      purpose: 'password_reset',
      usedAt: null
    }).sort({ createdAt: -1 });

    if (!verification) {
      throw new ApiError(400, 'No reset code found');
    }

    if (verification.attempts >= MAX_ATTEMPTS) {
      throw new ApiError(429, 'Too many attempts. Request a new code.');
    }

    if (verification.expiresAt < new Date()) {
      throw new ApiError(400, 'Reset code has expired');
    }

    const match = await compareCode(code, verification.codeHash);
    if (!match) {
      verification.attempts += 1;
      await verification.save();
      throw new ApiError(400, 'Invalid reset code');
    }

    res.json({ message: 'Reset code verified successfully' });
  })
);

router.post(
  '/reset-password',
  asyncHandler(async (req, res) => {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      throw new ApiError(400, 'Email, code, and new password are required');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new ApiError(400, 'Invalid email or code');
    }

    const verification = await EmailVerificationCode.findOne({
      user: user._id,
      purpose: 'password_reset',
      usedAt: null
    }).sort({ createdAt: -1 });

    if (!verification || verification.expiresAt < new Date()) {
      throw new ApiError(400, 'Reset code invalid or expired');
    }

    if (verification.attempts >= MAX_ATTEMPTS) {
      throw new ApiError(429, 'Too many attempts. Request a new code.');
    }

    const match = await compareCode(code, verification.codeHash);
    if (!match) {
      verification.attempts += 1;
      await verification.save();
      throw new ApiError(400, 'Invalid reset code');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    verification.usedAt = new Date();
    await verification.save();

    res.clearCookie('auth_token', cookieOptions());
    res.json({ message: 'Password reset successful. Please log in again.' });
  })
);

module.exports = router;
