'use strict';

/**
 * Vyro Management System - Command Aliases (for reference/documentation)
 * مراجع أوامر النظام
 */

const commandAliases = {
  'claim': 'استلام التذكرة',
  'unclaim': 'إلغاء استلام التذكرة',
  'review': 'تحويل التذكرة للمراجعة',
  'review-end': 'إنهاء المراجعة',
  'transfer': 'تحويل التذكرة لإداري آخر',
  'add': 'إضافة شخص للتذكرة',
  'remove': 'إزالة شخص من التذكرة',
  'close': 'قفل التذكرة',
  'reopen': 'إعادة فتح التذكرة',
  'delete': 'حذف التذكرة',
  'rename': 'إعادة تسمية التذكرة',
  'priority': 'تغيير أولوية التذكرة',
  'transcript': 'إنشاء نسخة من المحادثة',
  'ticket-info': 'معلومات التذكرة',
  'ticket-panel': 'لوحة التذاكر',
  'warn': 'إنذار عضو',
  'warnings': 'عرض الإنذارات',
  'remove-warning': 'حذف إنذار',
  'clear-warnings': 'مسح جميع الإنذارات',
  'timeout': 'إسكات عضو مؤقتاً',
  'untimeout': 'رفع الإسكات',
  'kick': 'طرد عضو',
  'ban': 'حظر عضو',
  'unban': 'رفع الحظر',
  'clear': 'مسح رسائل',
  'slowmode': 'تعيين وضع التأخير',
  'lock': 'قفل القناة',
  'unlock': 'فتح القناة',
  'welcome-config': 'إعدادات رسائل الترحيب',
  'goodbye-config': 'إعدادات رسائل الوداع',
  'autoreply-add': 'إضافة رد تلقائي',
  'autoreply-remove': 'حذف رد تلقائي',
  'autoreply-list': 'قائمة الردود التلقائية',
  'autoreply-toggle': 'تفعيل/تعطيل رد تلقائي',
  'settings': 'إعدادات السيرفر',
  'ping': 'اختبار الاستجابة',
  'server': 'معلومات السيرفر',
  'user': 'معلومات العضو',
  'avatar': 'صورة العضو',
  'bot-info': 'معلومات البوت',
  'help': 'المساعدة',
};

module.exports = commandAliases;
