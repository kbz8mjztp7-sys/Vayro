'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { query } = require('../../database/database');
const { logConfigChange } = require('../../services/loggingService');
const { isAdmin } = require('../../utils/permissions');
const { successEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome-config')
    .setDescription('إعدادات رسائل الترحيب / Configure welcome messages')
    .setDefaultMemberPermissions(0x8)
    .addSubcommand(sub => sub.setName('enable').setDescription('تفعيل رسائل الترحيب / Enable welcome messages'))
    .addSubcommand(sub => sub.setName('disable').setDescription('تعطيل رسائل الترحيب / Disable welcome messages'))
    .addSubcommand(sub => sub.setName('channel').setDescription('تعيين قناة الترحيب / Set welcome channel')
      .addChannelOption(o => o.setName('channel').setDescription('القناة / Channel').setRequired(true)))
    .addSubcommand(sub => sub.setName('title').setDescription('تعيين عنوان الرسالة / Set message title')
      .addStringOption(o => o.setName('text').setDescription('العنوان / Title').setRequired(true).setMaxLength(256)))
    .addSubcommand(sub => sub.setName('description').setDescription('تعيين وصف الرسالة / Set description')
      .addStringOption(o => o.setName('text').setDescription('الوصف (يدعم {user} {server} {memberCount}) / Description').setRequired(true).setMaxLength(2000)))
    .addSubcommand(sub => sub.setName('color').setDescription('تعيين لون الـ embed / Set embed color (hex)')
      .addStringOption(o => o.setName('hex').setDescription('اللون السداسي / Hex color (e.g. 5865F2)').setRequired(true).setMaxLength(6)))
    .addSubcommand(sub => sub.setName('autorole').setDescription('تعيين دور تلقائي / Set auto-assign role')
      .addRoleOption(o => o.setName('role').setDescription('الدور / Role').setRequired(true)))
    .addSubcommand(sub => sub.setName('preview').setDescription('معاينة رسالة الترحيب / Preview welcome message')),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: '❌ المديرون فقط. / Admins only.', ephemeral: true });
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    await interaction.deferReply({ ephemeral: true });

    // Upsert base record
    await query(`INSERT INTO server_settings (guild_id) VALUES ($1) ON CONFLICT (guild_id) DO NOTHING`, [guildId]);

    let msg = '';
    if (sub === 'enable') {
      await query(`UPDATE server_settings SET welcome_enabled=true WHERE guild_id=$1`, [guildId]);
      msg = '✅ تم تفعيل رسائل الترحيب. / Welcome messages enabled.';
    } else if (sub === 'disable') {
      await query(`UPDATE server_settings SET welcome_enabled=false WHERE guild_id=$1`, [guildId]);
      msg = '✅ تم تعطيل رسائل الترحيب. / Welcome messages disabled.';
    } else if (sub === 'channel') {
      const ch = interaction.options.getChannel('channel');
      await query(`UPDATE server_settings SET welcome_channel_id=$1 WHERE guild_id=$2`, [ch.id, guildId]);
      msg = `✅ تم تعيين قناة الترحيب إلى <#${ch.id}>. / Welcome channel set to <#${ch.id}>.`;
    } else if (sub === 'title') {
      const text = interaction.options.getString('text');
      await query(`UPDATE server_settings SET welcome_title=$1 WHERE guild_id=$2`, [text, guildId]);
      msg = `✅ تم تعيين العنوان. / Title set.`;
    } else if (sub === 'description') {
      const text = interaction.options.getString('text');
      await query(`UPDATE server_settings SET welcome_description=$1 WHERE guild_id=$2`, [text, guildId]);
      msg = `✅ تم تعيين الوصف. / Description set.`;
    } else if (sub === 'color') {
      const hex = interaction.options.getString('hex').replace('#', '');
      await query(`UPDATE server_settings SET welcome_color=$1 WHERE guild_id=$2`, [hex, guildId]);
      msg = `✅ تم تعيين اللون. / Color set.`;
    } else if (sub === 'autorole') {
      const role = interaction.options.getRole('role');
      await query(`UPDATE server_settings SET welcome_auto_role=$1 WHERE guild_id=$2`, [role.id, guildId]);
      msg = `✅ تم تعيين الدور التلقائي <@&${role.id}>. / Auto-role set.`;
    } else if (sub === 'preview') {
      const result = await query(`SELECT * FROM server_settings WHERE guild_id=$1`, [guildId]);
      const s = result.rows[0];
      if (!s) return interaction.editReply({ content: '❌ لم يتم إعداد رسائل الترحيب بعد. / Not configured yet.' });
      msg = `**معاينة الترحيب / Welcome Preview:**\nمُفعّل: ${s.welcome_enabled ? 'نعم' : 'لا'}\nالقناة: ${s.welcome_channel_id ? `<#${s.welcome_channel_id}>` : 'غير محدد'}\nالعنوان: ${s.welcome_title}\nالوصف: ${s.welcome_description}\nاللون: #${s.welcome_color}\nالدور التلقائي: ${s.welcome_auto_role ? `<@&${s.welcome_auto_role}>` : 'لا يوجد'}`;
    }

    await logConfigChange('تغيير إعدادات الترحيب / Welcome Config Changed', { performer: interaction.member.id, details: `subcommand: ${sub}` });
    await interaction.editReply({ content: msg });
  },
};
