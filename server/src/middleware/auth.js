const User = require('../models/User');
const { verifyAuthToken } = require('../services/tokenService');
const { ApiError } = require('../utils/errors');
const { asyncHandler } = require('../utils/asyncHandler');

const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = req.cookies.auth_token;
  if (!token) {
    throw new ApiError(401, 'Authentication required');
  }

  let payload;
  try {
    payload = verifyAuthToken(token);
  } catch (_err) {
    throw new ApiError(401, 'Invalid or expired session');
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw new ApiError(401, 'User not found');
  }

  req.user = user;
  next();
});

module.exports = { requireAuth };
