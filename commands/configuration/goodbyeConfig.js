'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { query } = require('../../database/database');
const { logConfigChange } = require('../../services/loggingService');
const { isAdmin } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('goodbye-config')
    .setDescription('إعدادات رسائل الوداع / Configure goodbye messages')
    .setDefaultMemberPermissions(0x8)
    .addSubcommand(sub => sub.setName('enable').setDescription('تفعيل رسائل الوداع / Enable goodbye'))
    .addSubcommand(sub => sub.setName('disable').setDescription('تعطيل رسائل الوداع / Disable goodbye'))
    .addSubcommand(sub => sub.setName('channel').setDescription('تعيين القناة / Set channel')
      .addChannelOption(o => o.setName('channel').setDescription('القناة / Channel').setRequired(true)))
    .addSubcommand(sub => sub.setName('title').setDescription('تعيين العنوان / Set title')
      .addStringOption(o => o.setName('text').setDescription('العنوان / Title').setRequired(true).setMaxLength(256)))
    .addSubcommand(sub => sub.setName('description').setDescription('تعيين الوصف / Set description')
      .addStringOption(o => o.setName('text').setDescription('الوصف / Description (supports {username} {server} {memberCount})').setRequired(true).setMaxLength(2000))),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: '❌ المديرون فقط. / Admins only.', ephemeral: true });
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    await interaction.deferReply({ ephemeral: true });

    await query(`INSERT INTO server_settings (guild_id) VALUES ($1) ON CONFLICT (guild_id) DO NOTHING`, [guildId]);

    let msg = '';
    if (sub === 'enable') {
      await query(`UPDATE server_settings SET goodbye_enabled=true WHERE guild_id=$1`, [guildId]);
      msg = '✅ تم تفعيل رسائل الوداع. / Goodbye messages enabled.';
    } else if (sub === 'disable') {
      await query(`UPDATE server_settings SET goodbye_enabled=false WHERE guild_id=$1`, [guildId]);
      msg = '✅ تم تعطيل رسائل الوداع. / Goodbye messages disabled.';
    } else if (sub === 'channel') {
      const ch = interaction.options.getChannel('channel');
      await query(`UPDATE server_settings SET goodbye_channel_id=$1 WHERE guild_id=$2`, [ch.id, guildId]);
      msg = `✅ تم تعيين قناة الوداع إلى <#${ch.id}>. / Goodbye channel set.`;
    } else if (sub === 'title') {
      const text = interaction.options.getString('text');
      await query(`UPDATE server_settings SET goodbye_title=$1 WHERE guild_id=$2`, [text, guildId]);
      msg = `✅ تم تعيين العنوان. / Title set.`;
    } else if (sub === 'description') {
      const text = interaction.options.getString('text');
      await query(`UPDATE server_settings SET goodbye_description=$1 WHERE guild_id=$2`, [text, guildId]);
      msg = `✅ تم تعيين الوصف. / Description set.`;
    }

    await logConfigChange('تغيير إعدادات الوداع / Goodbye Config Changed', { performer: interaction.member.id, details: `subcommand: ${sub}` });
    await interaction.editReply({ content: msg });
  },
};
