const mongoose = require('mongoose');

const recurringRuleSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: 'INR', trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    note: { type: String, trim: true, default: '' },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    nextRunAt: { type: Date, required: true, index: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('RecurringRule', recurringRuleSchema);
