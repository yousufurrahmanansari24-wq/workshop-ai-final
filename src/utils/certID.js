const { customAlphabet } = require('nanoid');

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);

/**
 * Generates a unique certificate ID
 * Format: WF-2026-YSF-4X2K9Z
 * @param {string} certPrefix - Teacher's cert prefix e.g. "YSF"
 */
function generateCertId(certPrefix) {
  const year = new Date().getFullYear();
  const prefix = (certPrefix || 'WF').toUpperCase().slice(0, 5);
  const unique = nanoid();
  return `WF-${year}-${prefix}-${unique}`;
}

/**
 * Formats a date nicely
 * e.g. "06th April 2026"
 */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDate();
  const suffix = getDaySuffix(day);
  const month = date.toLocaleString('en-IN', { month: 'long' });
  const year = date.getFullYear();
  return `${day}${suffix} ${month} ${year}`;
}

function getDaySuffix(day) {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

/**
 * Returns date and time formatted for emails
 * e.g. "Monday, 6th April 2026 at 10:00 AM"
 */
function formatDateTime(dateStr) {
  const date = new Date(dateStr);
  const day = date.toLocaleString('en-IN', { weekday: 'long' });
  const formatted = formatDate(dateStr);
  const time = date.toLocaleString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  return `${day}, ${formatted} at ${time}`;
}

/**
 * Check if a date is within X hours from now
 */
function isWithinHours(dateStr, hours) {
  const target = new Date(dateStr);
  const now = new Date();
  const diff = (target - now) / (1000 * 60 * 60);
  return diff >= 0 && diff <= hours;
}

module.exports = {
  generateCertId,
  formatDate,
  formatDateTime,
  isWithinHours
};
