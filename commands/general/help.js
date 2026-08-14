'use strict';

const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { baseEmbed } = require('../../utils/embeds');
const config = require('../../config/config');

const categories = {
  general: {
    label: '📋 عام / General',
    commands: [
      { name: '/help', perms: 'الجميع / Everyone', desc: 'يعرض قائمة الأوامر / Show command list', example: '/help' },
      { name: '/server', perms: 'الجميع / Everyone', desc: 'معلومات السيرفر / Server info', example: '/server' },
      { name: '/user', perms: 'الجميع / Everyone', desc: 'معلومات عضو / Member info', example: '/user @user' },
      { name: '/avatar', perms: 'الجميع / Everyone', desc: 'صورة عضو / Member avatar', example: '/avatar @user' },
      { name: '/ping', perms: 'الجميع / Everyone', desc: 'اختبار الاستجابة / Ping', example: '/ping' },
      { name: '/bot-info', perms: 'الجميع / Everyone', desc: 'معلومات البوت / Bot info', example: '/bot-info' },
    ],
  },
  tickets: {
    label: '🎫 التذاكر / Tickets',
    commands: [
      { name: '/ticket-panel', perms: 'المدير / Admin', desc: 'إنشاء لوحة التذاكر / Create ticket panel', example: '/ticket-panel' },
      { name: '/claim', perms: 'موظف / Staff', desc: 'استلام التذكرة / Claim ticket', example: '/claim' },
      { name: '/unclaim', perms: 'موظف / Staff', desc: 'إلغاء الاستلام / Unclaim ticket', example: '/unclaim' },
      { name: '/review', perms: 'موظف / Staff', desc: 'تحويل للمراجعة / Send to review', example: '/review' },
      { name: '/review-end', perms: 'إدارة / Management', desc: 'إنهاء المراجعة / End review', example: '/review-end' },
      { name: '/transfer', perms: 'موظف / Staff', desc: 'تحويل التذكرة / Transfer ticket', example: '/transfer staff:@user' },
      { name: '/add', perms: 'موظف / Staff', desc: 'إضافة شخص / Add user', example: '/add user:@user' },
      { name: '/remove', perms: 'موظف / Staff', desc: 'إزالة شخص / Remove user', example: '/remove user:@user' },
      { name: '/close', perms: 'صاحب التذكرة / Ticket owner', desc: 'قفل التذكرة / Close ticket', example: '/close' },
      { name: '/reopen', perms: 'موظف / Staff', desc: 'إعادة فتح / Reopen ticket', example: '/reopen' },
      { name: '/delete', perms: 'إدارة / Management', desc: 'حذف التذكرة / Delete ticket', example: '/delete' },
      { name: '/rename', perms: 'موظف / Staff', desc: 'إعادة تسمية / Rename', example: '/rename name:new-name' },
      { name: '/priority', perms: 'موظف / Staff', desc: 'تغيير الأولوية / Set priority', example: '/priority level:high' },
      { name: '/transcript', perms: 'موظف / Staff', desc: 'نسخة المحادثة / Transcript', example: '/transcript' },
      { name: '/ticket-info', perms: 'موظف / Staff', desc: 'معلومات التذكرة / Ticket info', example: '/ticket-info' },
    ],
  },
  moderation: {
    label: '🔨 الإشراف / Moderation',
    commands: [
      { name: '/warn', perms: 'مشرف / Moderator', desc: 'إنذار عضو / Warn member', example: '/warn user:@user reason:...' },
      { name: '/warnings', perms: 'مشرف / Moderator', desc: 'عرض الإنذارات / View warnings', example: '/warnings user:@user' },
      { name: '/remove-warning', perms: 'مشرف / Moderator', desc: 'حذف إنذار / Remove warning', example: '/remove-warning id:5' },
      { name: '/clear-warnings', perms: 'مدير / Admin', desc: 'مسح كل الإنذارات / Clear all warnings', example: '/clear-warnings user:@user' },
      { name: '/timeout', perms: 'مشرف / Moderator', desc: 'إسكات مؤقت / Timeout', example: '/timeout user:@user duration:1h' },
      { name: '/untimeout', perms: 'مشرف / Moderator', desc: 'رفع الإسكات / Remove timeout', example: '/untimeout user:@user' },
      { name: '/kick', perms: 'مشرف / Moderator', desc: 'طرد عضو / Kick', example: '/kick user:@user reason:...' },
      { name: '/ban', perms: 'مشرف / Moderator', desc: 'حظر عضو / Ban', example: '/ban user:@user reason:...' },
      { name: '/unban', perms: 'مشرف / Moderator', desc: 'رفع حظر / Unban', example: '/unban userid:123456' },
      { name: '/clear', perms: 'مشرف / Moderator', desc: 'مسح رسائل / Clear messages', example: '/clear amount:10' },
      { name: '/slowmode', perms: 'مشرف / Moderator', desc: 'وضع التأخير / Slowmode', example: '/slowmode seconds:5' },
      { name: '/lock', perms: 'مشرف / Moderator', desc: 'قفل القناة / Lock channel', example: '/lock' },
      { name: '/unlock', perms: 'مشرف / Moderator', desc: 'فتح القناة / Unlock channel', example: '/unlock' },
    ],
  },
  configuration: {
    label: '⚙️ الإعدادات / Configuration',
    commands: [
      { name: '/welcome-config', perms: 'مدير / Admin', desc: 'إعدادات الترحيب / Welcome config', example: '/welcome-config' },
      { name: '/goodbye-config', perms: 'مدير / Admin', desc: 'إعدادات الوداع / Goodbye config', example: '/goodbye-config' },
      { name: '/autoreply-add', perms: 'مدير / Admin', desc: 'إضافة رد تلقائي / Add auto-reply', example: '/autoreply-add trigger:hi response:Hello!' },
      { name: '/autoreply-remove', perms: 'مدير / Admin', desc: 'حذف رد تلقائي / Remove auto-reply', example: '/autoreply-remove id:1' },
      { name: '/autoreply-list', perms: 'مدير / Admin', desc: 'قائمة الردود / List auto-replies', example: '/autoreply-list' },
      { name: '/autoreply-toggle', perms: 'مدير / Admin', desc: 'تفعيل/تعطيل رد / Toggle auto-reply', example: '/autoreply-toggle id:1' },
      { name: '/settings', perms: 'مدير / Admin', desc: 'إعدادات السيرفر / Server settings', example: '/settings' },
    ],
  },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('قائمة المساعدة / Help menu'),

  async execute(interaction) {
    const embed = baseEmbed(config.colors.primary)
      .setTitle('📚 Vyro Management System — المساعدة / Help')
      .setDescription('اختر فئة من القائمة أدناه لعرض الأوامر.\nSelect a category from the menu below to view commands.');

    const select = new StringSelectMenuBuilder()
      .setCustomId('help_category')
      .setPlaceholder('اختر فئة / Select a category')
      .addOptions(Object.entries(categories).map(([value, cat]) => ({
        label: cat.label,
        value,
      })));

    const row = new ActionRowBuilder().addComponents(select);
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },
};

module.exports.categories = categories;
