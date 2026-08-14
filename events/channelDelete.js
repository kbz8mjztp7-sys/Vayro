'use strict';

const { getTicketByChannel, deleteTicket } = require('../services/ticketService');
const { logTicketAction } = require('../services/loggingService');

/**
 * channelDelete event
 *
 * Fires when any channel is deleted in a guild — including ticket channels
 * removed manually (without /delete). We look up the channel ID in the DB;
 * if a live ticket row exists we mark it deleted, save whatever messages are
 * still in Discord's cache as a plain-text transcript, and post a mod-log
 * entry so staff know what happened.
 *
 * Note: By the time this event fires the channel is already gone, so we
 * cannot fetch fresh messages from the API. We rely on the in-memory message
 * cache that Discord.js maintains while the bot is running.
 */
module.exports = {
  name: 'channelDelete',
  async execute(channel, client) {
    try {
      // Only care about guild text channels
      if (!channel.guild) return;

      // Check whether this channel was a tracked ticket
      const ticket = await getTicketByChannel(channel.id);
      if (!ticket) return;

      console.log(`[CHANNEL_DELETE] Ticket #${ticket.id} channel deleted (${channel.id}) — auto-closing.`);

      // ── Build a transcript from cached messages ──────────────────────────
      // Messages are sorted oldest-first for readability.
      let transcript = null;
      if (channel.messages && channel.messages.cache.size > 0) {
        const sorted = [...channel.messages.cache.values()].sort(
          (a, b) => a.createdTimestamp - b.createdTimestamp
        );

        const lines = sorted.map(msg => {
          const ts = new Date(msg.createdTimestamp).toISOString();
          const author = msg.author ? `${msg.author.tag} (${msg.author.id})` : 'Unknown';
          const content = msg.content || '[no text content]';
          const attachments = msg.attachments.size > 0
            ? ` [${msg.attachments.map(a => a.url).join(', ')}]`
            : '';
          return `[${ts}] ${author}: ${content}${attachments}`;
        });

        transcript = lines.join('\n');
      }

      // ── Mark the ticket as deleted in the database ───────────────────────
      // Use the bot's own client ID as the "deleted_by" actor to signal an
      // automatic closure rather than a staff action.
      const botId = client.user?.id || 'system';
      await deleteTicket(ticket.id, botId);

      // ── Log the event to the mod-log channel ────────────────────────────
      const details = {
        'الحدث / Event': 'Channel deleted manually (not via /delete)',
        'النوع / Type': ticket.ticket_type,
        'المنشئ / Creator': `<@${ticket.creator_id}>`,
      };

      if (ticket.claimed_by) {
        details['المطالب / Claimed By'] = `<@${ticket.claimed_by}>`;
      }

      if (transcript) {
        // Discord embed field values are capped at 1 024 chars; show a tail.
        const preview = transcript.length > 900
          ? '…\n' + transcript.slice(-900)
          : transcript;
        details['📜 آخر الرسائل / Last Messages'] = `\`\`\`\n${preview}\n\`\`\``;
      } else {
        details['📜 Transcript'] = 'No cached messages available.';
      }

      await logTicketAction('⚠️ قناة تذكرة حُذفت يدوياً / Ticket Channel Deleted Manually', {
        ticketId: ticket.id,
        // channel is gone — pass the raw ID as a string so the log still shows it
        details: {
          '📢 Channel ID (deleted)': channel.id,
          '📛 Channel Name': channel.name || 'unknown',
          ...details,
        },
      });

      console.log(`[CHANNEL_DELETE] Ticket #${ticket.id} marked as deleted and logged.`);
    } catch (err) {
      console.error('[CHANNEL_DELETE] Error handling channelDelete event:', err.message);
    }
  },
};
