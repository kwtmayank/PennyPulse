const User = require('../models/User');
const { verifyAuthToken } = require('../services/tokenService');
const { ApiError } = require('../utils/errors');
const { asyncHandler } = require('../utils/asyncHandler');

function readToken(req) {
  const cookieToken = req.cookies?.auth_token;
  if (cookieToken) return cookieToken;

  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }
  return '';
}

const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = readToken(req);
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

module.exports = { requireAuth, readToken };
