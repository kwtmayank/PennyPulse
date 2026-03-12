const express = require('express');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const RecurringRule = require('../models/RecurringRule');
const AppSettings = require('../models/AppSettings');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/errors');
const { toMonthBounds } = require('../utils/date');
const { reconcileRecurring, addFrequency } = require('../services/recurrenceService');

const router = express.Router();
router.use(requireAuth);

function pickAllowed(input, keys) {
  return keys.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      acc[key] = input[key];
    }
    return acc;
  }, {});
}

async function ensureCategoryOwned(categoryId, userId) {
  const category = await Category.findOne({ _id: categoryId, user: userId, isArchived: false });
  if (!category) {
    throw new ApiError(400, 'Invalid category');
  }
  return category;
}

router.post(
  '/recurring/reconcile',
  asyncHandler(async (req, res) => {
    const result = await reconcileRecurring(new Date(), req.user._id);
    res.json(result);
  })
);

router.get(
  '/settings',
  asyncHandler(async (req, res) => {
    const settings = await AppSettings.findOne({ user: req.user._id });
    res.json(settings || { defaultCurrency: 'INR', timezone: 'Asia/Kolkata' });
  })
);

router.patch(
  '/settings',
  asyncHandler(async (req, res) => {
    const { defaultCurrency, timezone } = req.body;
    const settings = await AppSettings.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          ...(defaultCurrency ? { defaultCurrency } : {}),
          ...(timezone ? { timezone } : {})
        }
      },
      { upsert: true, new: true }
    );

    res.json(settings);
  })
);

router.post(
  '/categories',
  asyncHandler(async (req, res) => {
    const { name, kind = 'expense' } = req.body;
    if (!name) throw new ApiError(400, 'Category name is required');
    let category;
    try {
      category = await Category.create({ user: req.user._id, name: name.trim(), kind });
    } catch (err) {
      if (err.code === 11000) {
        throw new ApiError(409, 'Category with this name already exists');
      }
      throw err;
    }
    res.status(201).json(category);
  })
);

router.get(
  '/categories',
  asyncHandler(async (req, res) => {
    const categories = await Category.find({ user: req.user._id, isArchived: false }).sort({ name: 1 });
    res.json(categories);
  })
);

router.patch(
  '/categories/:id',
  asyncHandler(async (req, res) => {
    const patch = pickAllowed(req.body, ['name', 'kind']);
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: patch },
      { new: true }
    );
    if (!category) throw new ApiError(404, 'Category not found');
    res.json(category);
  })
);

router.delete(
  '/categories/:id',
  asyncHandler(async (req, res) => {
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { isArchived: true } },
      { new: true }
    );
    if (!category) throw new ApiError(404, 'Category not found');
    res.json({ message: 'Category archived' });
  })
);

router.post(
  '/transactions',
  asyncHandler(async (req, res) => {
    const { type, amount, category, note, txnDate, currency = 'INR' } = req.body;
    if (!type || !amount || !category || !txnDate) {
      throw new ApiError(400, 'Missing required fields');
    }
    await ensureCategoryOwned(category, req.user._id);
    const item = await Transaction.create({
      user: req.user._id,
      type,
      amount,
      category,
      note,
      txnDate,
      currency,
      source: 'manual'
    });
    res.status(201).json(item);
  })
);

router.get(
  '/transactions',
  asyncHandler(async (req, res) => {
    await reconcileRecurring(new Date(), req.user._id);

    const query = { user: req.user._id };
    if (req.query.type) query.type = req.query.type;
    if (req.query.category) query.category = req.query.category;
    if (req.query.from || req.query.to) {
      query.txnDate = {};
      if (req.query.from) query.txnDate.$gte = new Date(req.query.from);
      if (req.query.to) query.txnDate.$lte = new Date(req.query.to);
    }

    const items = await Transaction.find(query)
      .populate('category', 'name kind')
      .sort({ txnDate: -1, createdAt: -1 });

    res.json(items);
  })
);

router.patch(
  '/transactions/:id',
  asyncHandler(async (req, res) => {
    const patch = pickAllowed(req.body, ['type', 'amount', 'category', 'note', 'txnDate', 'currency']);
    if (patch.category) {
      await ensureCategoryOwned(patch.category, req.user._id);
    }
    const txn = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: patch },
      { new: true }
    );
    if (!txn) throw new ApiError(404, 'Transaction not found');
    res.json(txn);
  })
);

router.delete(
  '/transactions/:id',
  asyncHandler(async (req, res) => {
    const txn = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!txn) throw new ApiError(404, 'Transaction not found');
    res.json({ message: 'Transaction deleted' });
  })
);

router.post(
  '/recurring-rules',
  asyncHandler(async (req, res) => {
    const { name, type, amount, category, note, frequency, startDate, endDate, currency = 'INR' } = req.body;
    if (!name || !type || !amount || !category || !frequency || !startDate) {
      throw new ApiError(400, 'Missing required fields');
    }
    await ensureCategoryOwned(category, req.user._id);

    const rule = await RecurringRule.create({
      user: req.user._id,
      name,
      type,
      amount,
      category,
      note,
      frequency,
      startDate,
      endDate: endDate || null,
      nextRunAt: new Date(startDate),
      currency
    });

    res.status(201).json(rule);
  })
);

router.get(
  '/recurring-rules',
  asyncHandler(async (req, res) => {
    const rules = await RecurringRule.find({ user: req.user._id }).populate('category', 'name kind').sort({ createdAt: -1 });
    res.json(rules);
  })
);

router.patch(
  '/recurring-rules/:id',
  asyncHandler(async (req, res) => {
    const patch = pickAllowed(req.body, [
      'name',
      'type',
      'amount',
      'currency',
      'category',
      'note',
      'frequency',
      'startDate',
      'endDate',
      'nextRunAt',
      'isActive'
    ]);
    if (patch.category) {
      await ensureCategoryOwned(patch.category, req.user._id);
    }
    if (patch.startDate && !patch.nextRunAt) {
      patch.nextRunAt = new Date(patch.startDate);
    }
    const rule = await RecurringRule.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: patch },
      { new: true }
    );
    if (!rule) throw new ApiError(404, 'Recurring rule not found');
    res.json(rule);
  })
);

router.delete(
  '/recurring-rules/:id',
  asyncHandler(async (req, res) => {
    const rule = await RecurringRule.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!rule) throw new ApiError(404, 'Recurring rule not found');
    res.json({ message: 'Recurring rule deleted' });
  })
);

router.post(
  '/recurring-rules/:id/run-now',
  asyncHandler(async (req, res) => {
    const rule = await RecurringRule.findOne({ _id: req.params.id, user: req.user._id });
    if (!rule) throw new ApiError(404, 'Recurring rule not found');

    const now = new Date();
    if (rule.nextRunAt > now) {
      rule.nextRunAt = now;
      await rule.save();
    }

    const result = await reconcileRecurring(now, req.user._id);
    res.json(result);
  })
);

router.get(
  '/dashboard/monthly',
  asyncHandler(async (req, res) => {
    await reconcileRecurring(new Date(), req.user._id);

    const month = req.query.month;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      throw new ApiError(400, 'month query is required in YYYY-MM format');
    }

    const { start, end } = toMonthBounds(month);

    const txns = await Transaction.find({
      user: req.user._id,
      txnDate: { $gte: start, $lt: end }
    }).populate('category', 'name');

    let income = 0;
    let expense = 0;
    const byCategory = {};

    for (const txn of txns) {
      if (txn.type === 'income') income += txn.amount;
      else expense += txn.amount;

      const label = txn.category?.name || 'Uncategorized';
      byCategory[label] = (byCategory[label] || 0) + txn.amount;
    }

    res.json({
      month,
      totals: {
        income,
        expense,
        balance: income - expense
      },
      categoryBreakdown: byCategory,
      transactionCount: txns.length
    });
  })
);

module.exports = router;
