const dotenv = require('dotenv');

dotenv.config();

const required = ['MONGODB_URI', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const splitOrigins = (value) =>
  (value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

module.exports = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  appTz: process.env.APP_TZ || 'Asia/Kolkata',
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  allowedOrigins: splitOrigins(process.env.ALLOWED_ORIGINS || 'http://localhost:5173'),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  mongodbUri: process.env.MONGODB_URI,
  resendApiKey: process.env.RESEND_API_KEY,
  resendFromEmail: process.env.RESEND_FROM_EMAIL || 'PennyPulse <noreply@example.com>'
};
