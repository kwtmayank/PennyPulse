const mongoose = require('mongoose');

const appSettingsSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    defaultCurrency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AppSettings', appSettingsSchema);
