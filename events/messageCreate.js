'use strict';

const { processMessage } = require('../services/autoReplyService');
const { handlePrefix }  = require('../handlers/prefixHandler');
const { handleBanner }  = require('../handlers/bannerHandler');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot || message.webhookId) return;

    // ── 1. Banner auto-send (owner posts in banner channel) ───────────────
    await handleBanner(message).catch(err => {
      console.error('[BANNER] Error:', err.message);
    });

    // ── 2. Prefix commands (+b, +بنعالي, +ub …) ──────────────────────────
    try {
      const handled = await handlePrefix(message);
      if (handled) return;
    } catch (err) {
      console.error('[PREFIX] Error:', err.message);
    }

    // ── 3. Auto-replies ───────────────────────────────────────────────────
    await processMessage(message).catch(err => {
      console.error('[AUTOREPLY] Error in processMessage:', err.message);
    });
  },
};
