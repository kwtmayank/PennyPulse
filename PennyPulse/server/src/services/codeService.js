const bcrypt = require('bcryptjs');

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function generateCode() {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

async function hashCode(code) {
  return bcrypt.hash(code, 10);
}

async function compareCode(raw, hashed) {
  return bcrypt.compare(raw, hashed);
}

module.exports = {
  generateCode,
  hashCode,
  compareCode,
  CODE_TTL_MS,
  MAX_ATTEMPTS
};
