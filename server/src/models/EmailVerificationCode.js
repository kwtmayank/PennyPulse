const mongoose = require('mongoose');

const codeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    codeHash: { type: String, required: true },
    purpose: {
      type: String,
      enum: ['signup_verify', 'password_reset'],
      required: true,
      index: true
    },
    expiresAt: { type: Date, required: true, index: true },
    attempts: { type: Number, default: 0 },
    usedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmailVerificationCode', codeSchema);
