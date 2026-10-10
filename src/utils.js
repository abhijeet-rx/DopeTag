/**
 * Utility functions for trending-repos CLI
 */

export const SUPPORTED_DURATIONS = ['day', 'week', 'month', 'year'];

const DURATION_ALIASES = {
  day: 'day',
  daily: 'day',
  d: 'day',
  week: 'week',
  weekly: 'week',
  w: 'week',
  month: 'month',
  monthly: 'month',
  m: 'month',
  year: 'year',
  yearly: 'year',
  y: 'year',
};

/**
 * Normalizes and validates the duration argument
 * @param {string} input - Duration input from user
 * @returns {string} Normalized duration ('day', 'week', 'month', 'year')
 * @throws {Error} If duration is invalid
 */
export function normalizeDuration(input) {
  if (!input || typeof input !== 'string') {
    throw new Error(
      `Invalid duration "${input}". Allowed values are: ${SUPPORTED_DURATIONS.join(', ')}.`
    );
  }

  const cleaned = input.trim().toLowerCase();
  const normalized = DURATION_ALIASES[cleaned];

  if (!normalized) {
    throw new Error(
      `Invalid duration "${input}". Allowed values are: ${SUPPORTED_DURATIONS.join(', ')}.`
    );
  }

  return normalized;
}

/**
 * Calculates the start date string (YYYY-MM-DD) based on duration
 * @param {string} duration - 'day', 'week', 'month', 'year'
 * @param {Date} [referenceDate=new Date()] - Date to calculate from
 * @returns {string} Date formatted as YYYY-MM-DD
 */
export function calculateSinceDate(duration, referenceDate = new Date()) {
  const normalized = normalizeDuration(duration);
  const date = new Date(referenceDate.getTime());

  switch (normalized) {
    case 'day':
      date.setUTCDate(date.getUTCDate() - 1);
      break;
    case 'week':
      date.setUTCDate(date.getUTCDate() - 7);
      break;
    case 'month':
      date.setUTCDate(date.getUTCDate() - 30);
      break;
    case 'year':
      date.setUTCDate(date.getUTCDate() - 365);
      break;
    default:
      throw new Error(`Unsupported duration: ${duration}`);
  }

  return date.toISOString().split('T')[0];
}

/**
 * Validates the limit argument
 * @param {number|string} limit - Number of repositories to fetch
 * @returns {number} Validated integer limit
 * @throws {Error} If limit is invalid
 */
export function validateLimit(limit) {
  const parsed = Number(limit);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid limit "${limit}". Limit must be a positive integer greater than 0.`);
  }

  if (parsed > 100) {
    throw new Error(
      `Limit "${limit}" exceeds maximum supported limit of 100 (GitHub API maximum per page).`
    );
  }

  return parsed;
}

/**
 * Formats a number with comma separators (e.g. 12345 -> 12,345)
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  return num.toLocaleString('en-US');
}

/**
 * Truncates text to max length with ellipsis
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(text, maxLength = 60) {
  if (!text) return '';
  const singleLine = text.replace(/[\r\n]+/g, ' ').trim();
  if (singleLine.length <= maxLength) return singleLine;
  return singleLine.slice(0, maxLength - 1) + '…';
}
