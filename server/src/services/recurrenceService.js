const RecurringRule = require('../models/RecurringRule');
const Transaction = require('../models/Transaction');

function addFrequency(date, frequency) {
  const d = new Date(date);
  if (frequency === 'daily') d.setDate(d.getDate() + 1);
  if (frequency === 'weekly') d.setDate(d.getDate() + 7);
  if (frequency === 'monthly') d.setMonth(d.getMonth() + 1);
  if (frequency === 'yearly') d.setFullYear(d.getFullYear() + 1);
  return d;
}

function periodMarker(date, frequency) {
  const d = new Date(date);
  const y = d.getUTCFullYear();
  const m = `${d.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${d.getUTCDate()}`.padStart(2, '0');

  if (frequency === 'yearly') return `${y}`;
  if (frequency === 'monthly') return `${y}-${m}`;
  return `${y}-${m}-${day}`;
}

async function reconcileRecurring(now, userId) {
  const rules = await RecurringRule.find({
    user: userId,
    isActive: true,
    nextRunAt: { $lte: now }
  }).sort({ nextRunAt: 1 });

  let generatedCount = 0;

  for (const rule of rules) {
    let currentRun = new Date(rule.nextRunAt);

    while (currentRun <= now) {
      if (rule.endDate && currentRun > rule.endDate) {
        rule.isActive = false;
        break;
      }

      const marker = periodMarker(currentRun, rule.frequency);
      const generatedKey = `${rule._id}:${marker}`;

      try {
        await Transaction.create({
          user: rule.user,
          type: rule.type,
          amount: rule.amount,
          currency: rule.currency,
          category: rule.category,
          note: rule.note,
          txnDate: currentRun,
          source: 'recurring',
          recurringRule: rule._id,
          generatedKey
        });
        generatedCount += 1;
      } catch (err) {
        if (err.code !== 11000) {
          throw err;
        }
      }

      currentRun = addFrequency(currentRun, rule.frequency);
      if (rule.endDate && currentRun > rule.endDate) {
        rule.isActive = false;
      }
    }

    rule.nextRunAt = currentRun;
    await rule.save();
  }

  return { generatedCount };
}

module.exports = { reconcileRecurring, addFrequency };
