const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: 'INR', trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    note: { type: String, trim: true, default: '' },
    txnDate: { type: Date, required: true, index: true },
    source: { type: String, enum: ['manual', 'recurring'], default: 'manual' },
    recurringRule: { type: mongoose.Schema.Types.ObjectId, ref: 'RecurringRule', default: null },
    generatedKey: { type: String, default: null }
  },
  { timestamps: true }
);

transactionSchema.index(
  { user: 1, generatedKey: 1 },
  {
    unique: true,
    partialFilterExpression: { generatedKey: { $type: 'string' } }
  }
);

module.exports = mongoose.model('Transaction', transactionSchema);
