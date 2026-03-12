const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signAuthToken(userId) {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

function verifyAuthToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

module.exports = { signAuthToken, verifyAuthToken };
