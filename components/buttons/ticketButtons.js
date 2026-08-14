'use strict';

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const { getTicketByChannel, getTicketType, claimTicket, unclaimTicket, closeTicket, reopenTicket, deleteTicket, updateTicketField } = require('../../services/ticketService');
const { generateTranscript, sendTranscript } = require('../../services/transcriptService');
const { logTicketAction } = require('../../services/loggingService');
const { ticketEmbed } = require('../../utils/embeds');
const { isSupport, isAdmin, isManagement } = require('../../utils/permissions');
const config = require('../../config/config');

function buildTicketActionRows() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_btn_claim').setLabel('✋ استلام / Claim').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('ticket_btn_unclaim').setLabel('↩️ إلغاء الاستلام / Unclaim').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('ticket_btn_review').setLabel('🔍 مراجعة / Review').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('ticket_btn_transfer').setLabel('🔄 تحويل / Transfer').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('ticket_btn_add').setLabel('➕ إضافة / Add').setStyle(ButtonStyle.Secondary),
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_btn_remove').setLabel('➖ إزالة / Remove').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('ticket_btn_close').setLabel('🔒 إغلاق / Close').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('ticket_btn_delete').setLabel('🗑️ حذف / Delete').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('ticket_btn_transcript').setLabel('📄 نسخة / Transcript').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('ticket_btn_info').setLabel('ℹ️ معلومات / Info').setStyle(ButtonStyle.Secondary),
  );
  return [row1, row2];
}

function buildClosedRows() {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_btn_reopen').setLabel('🔓 إعادة فتح / Reopen').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('ticket_btn_delete').setLabel('🗑️ حذف / Delete').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('ticket_btn_transcript').setLabel('📄 نسخة / Transcript').setStyle(ButtonStyle.Secondary),
  )];
}

async function handleTicketButton(interaction, client) {
  const customId = interaction.customId;
  const ticket = await getTicketByChannel(interaction.channel.id);

  // Confirm/Cancel buttons (no ticket needed)
  if (customId === 'ticket_close_confirm') return handleCloseConfirm(interaction);
  if (customId === 'ticket_close_cancel') return interaction.update({ content: '❌ تم إلغاء الإغلاق. / Close cancelled.', components: [] });
  if (customId === 'ticket_delete_confirm') return handleDeleteConfirm(interaction, client);
  if (customId === 'ticket_delete_cancel') return interaction.update({ content: '❌ تم إلغاء الحذف. / Delete cancelled.', components: [] });

  if (!ticket) return interaction.reply({ content: '❌ لم يتم العثور على التذكرة في قاعدة البيانات. / Ticket not found in database.', ephemeral: true });

  switch (customId) {
    case 'ticket_btn_claim': return handleClaim(interaction, ticket);
    case 'ticket_btn_unclaim': return handleUnclaim(interaction, ticket);
    case 'ticket_btn_review': return handleReview(interaction, ticket);
    case 'ticket_btn_transfer': return handleTransferBtn(interaction, ticket);
    case 'ticket_btn_close': return handleClose(interaction, ticket);
    case 'ticket_btn_reopen': return handleReopen(interaction, ticket);
    case 'ticket_btn_delete': return handleDelete(interaction, ticket);
    case 'ticket_btn_transcript': return handleTranscript(interaction, ticket, client);
    case 'ticket_btn_info': return handleInfo(interaction, ticket);
    case 'ticket_btn_add': return handleAddBtn(interaction, ticket);
    case 'ticket_btn_remove': return handleRemoveBtn(interaction, ticket);
    default: return interaction.reply({ content: '❌ زر غير معروف. / Unknown button.', ephemeral: true });
  }
}

async function handleClaim(interaction, ticket) {
  if (!isSupport(interaction.member)) return interaction.reply({ content: '❌ الموظفون فقط. / Staff only.', ephemeral: true });
  await interaction.deferReply({ ephemeral: true });
  try {
    const updated = await claimTicket(ticket.id, interaction.member.id, interaction.client);
    if (config.roles.support) await interaction.channel.permissionOverwrites.edit(config.roles.support, { ViewChannel: false }).catch(() => {});
    await interaction.channel.permissionOverwrites.edit(interaction.member.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true }).catch(() => {});
    const ticketType = getTicketType(ticket.ticket_type);
    if (ticket.opening_message_id) {
      const msg = await interaction.channel.messages.fetch(ticket.opening_message_id).catch(() => null);
      if (msg) await msg.edit({ embeds: [ticketEmbed(updated, ticketType)], components: buildTicketActionRows() }).catch(() => {});
    }
    await logTicketAction('تم استلام التذكرة / Ticket Claimed', { ticketId: ticket.id, performer: interaction.member.id, channel: interaction.channel.id });
    await interaction.editReply({ content: `✅ استلمت التذكرة #${ticket.id}. / Claimed ticket #${ticket.id}.` });
    await interaction.channel.send(`✅ <@${interaction.member.id}> استلم هذه التذكرة.`);
  } catch (err) {
    if (err.type === 'ALREADY_CLAIMED') return interaction.editReply({ content: `❌ مستلمة بالفعل من <@${err.claimedBy}>.` });
    throw err;
  }
}

async function handleUnclaim(interaction, ticket) {
  if (!isAdmin(interaction.member) && ticket.claimed_by !== interaction.member.id) return interaction.reply({ content: '❌ فقط الموظف المُستلِم أو المدير. / Only claimer or admin.', ephemeral: true });
  await interaction.deferReply({ ephemeral: true });
  const updated = await unclaimTicket(ticket.id, interaction.member.id);
  if (config.roles.support) await interaction.channel.permissionOverwrites.edit(config.roles.support, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true }).catch(() => {});
  if (ticket.claimed_by) {
    const staffMember = interaction.guild.members.cache.get(ticket.claimed_by);
    if (staffMember && !isAdmin(staffMember) && !isManagement(staffMember)) await interaction.channel.permissionOverwrites.delete(ticket.claimed_by).catch(() => {});
  }
  const ticketType = getTicketType(ticket.ticket_type);
  if (ticket.opening_message_id) {
    const msg = await interaction.channel.messages.fetch(ticket.opening_message_id).catch(() => null);
    if (msg) await msg.edit({ embeds: [ticketEmbed(updated, ticketType)], components: buildTicketActionRows() }).catch(() => {});
  }
  await logTicketAction('إلغاء استلام التذكرة / Ticket Unclaimed', { ticketId: ticket.id, performer: interaction.member.id, channel: interaction.channel.id });
  await interaction.editReply({ content: `✅ تم إلغاء استلام التذكرة #${ticket.id}.` });
  await interaction.channel.send(`↩️ <@${interaction.member.id}> أعاد التذكرة للطابور.`);
}

async function handleReview(interaction, ticket) {
  if (!isSupport(interaction.member)) return interaction.reply({ content: '❌ الموظفون فقط. / Staff only.', ephemeral: true });
  await interaction.deferReply({ ephemeral: true });
  const updated = await updateTicketField(ticket.id, 'status', 'review');
  if (config.channels.reviewTicketCategory) await interaction.channel.setParent(config.channels.reviewTicketCategory, { lockPermissions: false }).catch(() => {});
  const ticketType = getTicketType(ticket.ticket_type);
  if (ticket.opening_message_id) {
    const msg = await interaction.channel.messages.fetch(ticket.opening_message_id).catch(() => null);
    if (msg) await msg.edit({ embeds: [ticketEmbed(updated, ticketType)], components: buildTicketActionRows() }).catch(() => {});
  }
  await logTicketAction('قيد المراجعة / Under Review', { ticketId: ticket.id, performer: interaction.member.id, channel: interaction.channel.id });
  await interaction.editReply({ content: `✅ تم تحويل التذكرة للمراجعة.` });
}

async function handleTransferBtn(interaction, ticket) {
  if (!isSupport(interaction.member) && !isAdmin(interaction.member)) return interaction.reply({ content: '❌ الموظفون فقط. / Staff only.', ephemeral: true });
  return interaction.reply({ content: '💡 استخدم الأمر `/transfer staff:@user` لتحويل التذكرة. / Use `/transfer staff:@user` to transfer.', ephemeral: true });
}

async function handleAddBtn(interaction, ticket) {
  if (!isSupport(interaction.member)) return interaction.reply({ content: '❌ الموظفون فقط. / Staff only.', ephemeral: true });
  return interaction.reply({ content: '💡 استخدم الأمر `/add user:@user` لإضافة عضو. / Use `/add user:@user` to add.', ephemeral: true });
}

async function handleRemoveBtn(interaction, ticket) {
  if (!isSupport(interaction.member)) return interaction.reply({ content: '❌ الموظفون فقط. / Staff only.', ephemeral: true });
  return interaction.reply({ content: '💡 استخدم الأمر `/remove user:@user` لإزالة عضو. / Use `/remove user:@user` to remove.', ephemeral: true });
}

async function handleClose(interaction, ticket) {
  const member = interaction.member;
  const isCreator = ticket.creator_id === member.id;
  const isClaimant = ticket.claimed_by === member.id;
  const staffAllowed = isClaimant || (!ticket.claimed_by && isSupport(member)) || isAdmin(member);
  if (!isCreator && !staffAllowed) return interaction.reply({ content: '❌ ليس لديك صلاحية إغلاق هذه التذكرة.', ephemeral: true });

  const { ActionRowBuilder: ARB, ButtonBuilder: BB, ButtonStyle: BS } = require('discord.js');
  const row = new ARB().addComponents(
    new BB().setCustomId('ticket_close_confirm').setLabel('✅ تأكيد').setStyle(BS.Danger),
    new BB().setCustomId('ticket_close_cancel').setLabel('❌ إلغاء').setStyle(BS.Secondary),
  );
  await interaction.reply({ content: '⚠️ هل أنت متأكد من إغلاق هذه التذكرة؟', components: [row], ephemeral: true });
}

async function handleCloseConfirm(interaction) {
  await interaction.deferUpdate();
  const ticket = await getTicketByChannel(interaction.channel.id);
  if (!ticket) return;

  const updated = await closeTicket(ticket.id, interaction.member.id);
  await interaction.channel.permissionOverwrites.edit(ticket.creator_id, { SendMessages: false }).catch(() => {});
  if (config.channels.closedTicketCategory) await interaction.channel.setParent(config.channels.closedTicketCategory, { lockPermissions: false }).catch(() => {});

  const ticketType = getTicketType(ticket.ticket_type);
  if (ticket.opening_message_id) {
    const msg = await interaction.channel.messages.fetch(ticket.opening_message_id).catch(() => null);
    if (msg) await msg.edit({ embeds: [ticketEmbed(updated, ticketType)], components: buildClosedRows() }).catch(() => {});
  }

  await logTicketAction('تم إغلاق التذكرة / Ticket Closed', { ticketId: ticket.id, performer: interaction.member.id, channel: interaction.channel.id });
  await interaction.channel.send(`🔒 <@${interaction.member.id}> أغلق هذه التذكرة. / closed this ticket.\n\nللإعادة: /reopen | للحذف: /delete | لنسخة: /transcript`);
}

async function handleReopen(interaction, ticket) {
  if (!isSupport(interaction.member)) return interaction.reply({ content: '❌ الموظفون فقط.', ephemeral: true });
  await interaction.deferReply({ ephemeral: true });
  const updated = await reopenTicket(ticket.id, interaction.member.id);
  await interaction.channel.permissionOverwrites.edit(ticket.creator_id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true }).catch(() => {});
  const origCategory = ticket.category_id || config.channels.ticketCategory;
  if (origCategory) await interaction.channel.setParent(origCategory, { lockPermissions: false }).catch(() => {});
  const ticketType = getTicketType(ticket.ticket_type);
  if (ticket.opening_message_id) {
    const msg = await interaction.channel.messages.fetch(ticket.opening_message_id).catch(() => null);
    if (msg) await msg.edit({ embeds: [ticketEmbed(updated, ticketType)], components: buildTicketActionRows() }).catch(() => {});
  }
  await logTicketAction('إعادة فتح التذكرة / Ticket Reopened', { ticketId: ticket.id, performer: interaction.member.id, channel: interaction.channel.id });
  await interaction.editReply({ content: `✅ تمت إعادة الفتح.` });
  await interaction.channel.send(`🔓 <@${interaction.member.id}> أعاد فتح التذكرة.`);
}

async function handleDelete(interaction, ticket) {
  if (!isManagement(interaction.member)) return interaction.reply({ content: '❌ الإدارة فقط.', ephemeral: true });
  const { ActionRowBuilder: ARB, ButtonBuilder: BB, ButtonStyle: BS } = require('discord.js');
  const row = new ARB().addComponents(
    new BB().setCustomId('ticket_delete_confirm').setLabel('🗑️ حذف').setStyle(BS.Danger),
    new BB().setCustomId('ticket_delete_cancel').setLabel('❌ إلغاء').setStyle(BS.Secondary),
  );
  await interaction.reply({ content: `⚠️ سيتم حذف التذكرة #${ticket.id} بعد إنشاء نسخة منها.`, components: [row], ephemeral: true });
}

async function handleDeleteConfirm(interaction, client) {
  await interaction.deferUpdate();
  const ticket = await getTicketByChannel(interaction.channel.id);
  if (!ticket) return;

  const ticketType = getTicketType(ticket.ticket_type);
  const typeName = ticketType ? `${ticketType.nameAr} / ${ticketType.nameEn}` : ticket.ticket_type;
  const { attachment, filename } = await generateTranscript(interaction.channel, ticket, typeName);
  await sendTranscript(client, ticket, attachment, filename);

  await deleteTicket(ticket.id, interaction.member.id);
  await logTicketAction('تم حذف التذكرة / Ticket Deleted', { ticketId: ticket.id, performer: interaction.member.id, channel: interaction.channel.id });

  let count = 5;
  const deleteMsg = await interaction.channel.send(`🗑️ سيتم حذف هذه القناة خلال ${count} ثوانٍ... / Channel will be deleted in ${count}s...`);
  const interval = setInterval(async () => {
    count--;
    if (count <= 0) {
      clearInterval(interval);
      await interaction.channel.delete().catch(() => {});
    } else {
      await deleteMsg.edit(`🗑️ سيتم حذف هذه القناة خلال ${count} ثوانٍ... / Channel will be deleted in ${count}s...`).catch(() => {});
    }
  }, 1000);
}

async function handleTranscript(interaction, ticket, client) {
  if (!isSupport(interaction.member)) return interaction.reply({ content: '❌ الموظفون فقط.', ephemeral: true });
  await interaction.deferReply({ ephemeral: true });
  const ticketType = getTicketType(ticket.ticket_type);
  const typeName = ticketType ? `${ticketType.nameAr} / ${ticketType.nameEn}` : ticket.ticket_type;
  const { attachment, filename, messageCount } = await generateTranscript(interaction.channel, ticket, typeName);
  await sendTranscript(client, ticket, attachment, filename);
  await interaction.editReply({ content: `✅ تم إنشاء نسخة التذكرة (${messageCount} رسالة).`, files: [attachment] });
}

async function handleInfo(interaction, ticket) {
  const { STATUS_LABELS, PRIORITY_LABELS } = require('../../utils/constants');
  const { formatTimestamp } = require('../../utils/sanitizers');
  const { baseEmbed } = require('../../utils/embeds');
  const ticketType = getTicketType(ticket.ticket_type);
  const embed = baseEmbed(config.colors.primary)
    .setTitle(`🎫 معلومات التذكرة #${ticket.id}`)
    .addFields(
      { name: '👤 المُرسِل', value: `<@${ticket.creator_id}>`, inline: true },
      { name: '📂 النوع', value: ticketType ? `${ticketType.emoji} ${ticketType.nameAr}` : ticket.ticket_type, inline: true },
      { name: '📋 الحالة', value: STATUS_LABELS[ticket.status] || ticket.status, inline: true },
      { name: '🔖 الأولوية', value: PRIORITY_LABELS[ticket.priority] || ticket.priority, inline: true },
      { name: '👮 مُستلَم بواسطة', value: ticket.claimed_by ? `<@${ticket.claimed_by}>` : 'لم يُستلَم', inline: true },
      { name: '📌 الموضوع', value: ticket.subject || 'غير محدد', inline: false },
      { name: '🕐 تاريخ الإنشاء', value: formatTimestamp(ticket.created_at), inline: true },
    );
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

function register(registerButtonHandler) {
  registerButtonHandler('ticket_btn_', handleTicketButton);
  registerButtonHandler('ticket_close_confirm', handleTicketButton);
  registerButtonHandler('ticket_close_cancel', handleTicketButton);
  registerButtonHandler('ticket_delete_confirm', (i, client) => handleDeleteConfirm(i, client));
  registerButtonHandler('ticket_delete_cancel', handleTicketButton);
}

module.exports = { buildTicketActionRows, buildClosedRows, register };
