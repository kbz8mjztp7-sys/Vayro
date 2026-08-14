'use strict';

/**
 * Vyro Management System - Default Auto-Reply Examples
 * أمثلة ردود تلقائية افتراضية - يمكن تعديلها من قاعدة البيانات
 * These are example defaults only. Manage live auto-replies via /autoreply-add
 */

const defaultAutoReplies = [
  {
    trigger: 'discord token',
    response: '⚠️ تحذير: لا تشارك توكن Discord الخاص بك مع أي أحد! هذا يمنح الوصول الكامل لحسابك.\n⚠️ Warning: Never share your Discord token! It gives full access to your account.',
    matchType: 'contains',
    enabled: true,
  },
  {
    trigger: 'invite link',
    response: '🔗 يمكنك دعوة الأصدقاء عبر رابط الدعوة الموجود في ملف السيرفر.\n🔗 You can invite friends using the invite link in the server profile.',
    matchType: 'contains',
    enabled: false,
  },
  {
    trigger: 'rules',
    response: '📋 يرجى مراجعة قناة القوانين للاطلاع على قواعد السيرفر.\n📋 Please check the rules channel to read the server rules.',
    matchType: 'exact',
    enabled: false,
  },
];

module.exports = defaultAutoReplies;
