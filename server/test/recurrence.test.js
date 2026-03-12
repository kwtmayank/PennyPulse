const test = require('node:test');
const assert = require('node:assert/strict');
const { addFrequency } = require('../src/services/recurrenceService');

test('addFrequency daily adds 1 day', () => {
  const d = new Date('2026-01-01T00:00:00.000Z');
  const next = addFrequency(d, 'daily');
  assert.equal(next.toISOString(), '2026-01-02T00:00:00.000Z');
});

test('addFrequency weekly adds 7 days', () => {
  const d = new Date('2026-01-01T00:00:00.000Z');
  const next = addFrequency(d, 'weekly');
  assert.equal(next.toISOString(), '2026-01-08T00:00:00.000Z');
});

test('addFrequency monthly increments month', () => {
  const d = new Date('2026-01-15T00:00:00.000Z');
  const next = addFrequency(d, 'monthly');
  assert.equal(next.getUTCMonth(), 1);
});

test('addFrequency yearly increments year', () => {
  const d = new Date('2026-01-15T00:00:00.000Z');
  const next = addFrequency(d, 'yearly');
  assert.equal(next.getUTCFullYear(), 2027);
});
