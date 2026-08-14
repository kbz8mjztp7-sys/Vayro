'use strict';

/**
 * Input sanitization utilities
 * أدوات تنظيف المدخلات
 */

function sanitizeChannelName(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100)
    || 'ticket';
}

function sanitizeUsername(username) {
  return username
    .replace(/[^\w\s-_.]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 32)
    || 'user';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeMarkdown(str) {
  if (!str) return '';
  return String(str).replace(/([*_`~\\|])/g, '\\$1');
}

function truncate(str, maxLength = 1024) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

function parseDuration(durationStr) {
  if (!durationStr) return null;
  const match = durationStr.match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return null;
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * multipliers[unit];
}

function formatDuration(ms) {
  if (!ms) return 'غير محدد / Unknown';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s} ثانية / seconds`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} دقيقة / minutes`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ساعة / hours`;
  const d = Math.floor(h / 24);
  return `${d} يوم / days`;
}

function formatTimestamp(date) {
  if (!date) return 'غير محدد';
  return `<t:${Math.floor(new Date(date).getTime() / 1000)}:F>`;
}

function formatRelativeTime(date) {
  if (!date) return 'غير محدد';
  return `<t:${Math.floor(new Date(date).getTime() / 1000)}:R>`;
}

module.exports = {
  sanitizeChannelName,
  sanitizeUsername,
  escapeHtml,
  escapeMarkdown,
  truncate,
  parseDuration,
  formatDuration,
  formatTimestamp,
  formatRelativeTime,
};
