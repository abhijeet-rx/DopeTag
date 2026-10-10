import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeDuration,
  calculateSinceDate,
  validateLimit,
  formatNumber,
  truncate,
  SUPPORTED_DURATIONS,
} from '../src/utils.js';

describe('utils: normalizeDuration', () => {
  it('should accept valid standard duration strings', () => {
    assert.equal(normalizeDuration('day'), 'day');
    assert.equal(normalizeDuration('week'), 'week');
    assert.equal(normalizeDuration('month'), 'month');
    assert.equal(normalizeDuration('year'), 'year');
  });

  it('should be case-insensitive and trim whitespace', () => {
    assert.equal(normalizeDuration('  DAY  '), 'day');
    assert.equal(normalizeDuration('Week'), 'week');
    assert.equal(normalizeDuration('MONTH'), 'month');
    assert.equal(normalizeDuration(' Year '), 'year');
  });

  it('should support duration aliases', () => {
    assert.equal(normalizeDuration('daily'), 'day');
    assert.equal(normalizeDuration('weekly'), 'week');
    assert.equal(normalizeDuration('monthly'), 'month');
    assert.equal(normalizeDuration('yearly'), 'year');
    assert.equal(normalizeDuration('d'), 'day');
    assert.equal(normalizeDuration('w'), 'week');
    assert.equal(normalizeDuration('m'), 'month');
    assert.equal(normalizeDuration('y'), 'year');
  });

  it('should throw an informative error for unsupported duration', () => {
    assert.throws(
      () => normalizeDuration('decade'),
      /Invalid duration "decade". Allowed values are: day, week, month, year/
    );
    assert.throws(() => normalizeDuration(''), /Invalid duration/);
    assert.throws(() => normalizeDuration(null), /Invalid duration/);
  });
});

describe('utils: calculateSinceDate', () => {
  const fixedDate = new Date('2026-10-10T12:00:00Z');

  it('should calculate 1 day ago for day', () => {
    const result = calculateSinceDate('day', fixedDate);
    assert.equal(result, '2026-10-09');
  });

  it('should calculate 7 days ago for week', () => {
    const result = calculateSinceDate('week', fixedDate);
    assert.equal(result, '2026-10-03');
  });

  it('should calculate 30 days ago for month', () => {
    const result = calculateSinceDate('month', fixedDate);
    assert.equal(result, '2026-09-10');
  });

  it('should calculate 365 days ago for year', () => {
    const result = calculateSinceDate('year', fixedDate);
    assert.equal(result, '2025-10-10');
  });
});

describe('utils: validateLimit', () => {
  it('should accept valid positive numbers between 1 and 100', () => {
    assert.equal(validateLimit(1), 1);
    assert.equal(validateLimit('10'), 10);
    assert.equal(validateLimit(100), 100);
  });

  it('should reject numbers <= 0', () => {
    assert.throws(() => validateLimit(0), /must be a positive integer/);
    assert.throws(() => validateLimit(-5), /must be a positive integer/);
  });

  it('should reject non-integers and NaN', () => {
    assert.throws(() => validateLimit('abc'), /must be a positive integer/);
    assert.throws(() => validateLimit(3.14), /must be a positive integer/);
  });

  it('should reject numbers > 100', () => {
    assert.throws(() => validateLimit(101), /exceeds maximum supported limit of 100/);
    assert.throws(() => validateLimit(500), /exceeds maximum supported limit of 100/);
  });
});

describe('utils: formatNumber', () => {
  it('should format numbers with comma grouping', () => {
    assert.equal(formatNumber(0), '0');
    assert.equal(formatNumber(42), '42');
    assert.equal(formatNumber(1000), '1,000');
    assert.equal(formatNumber(1234567), '1,234,567');
  });

  it('should fallback to 0 for non-numeric input', () => {
    assert.equal(formatNumber(null), '0');
    assert.equal(formatNumber(NaN), '0');
  });
});

describe('utils: truncate', () => {
  it('should not truncate string shorter than maxLength', () => {
    assert.equal(truncate('Hello world', 20), 'Hello world');
  });

  it('should truncate and add ellipsis for string longer than maxLength', () => {
    const text = 'This is a long sentence that needs truncating';
    const truncated = truncate(text, 15);
    assert.equal(truncated.length, 15);
    assert.ok(truncated.endsWith('…'));
  });

  it('should collapse newlines into spaces', () => {
    assert.equal(truncate('Hello\nworld\r\ntest', 50), 'Hello world test');
  });
});
