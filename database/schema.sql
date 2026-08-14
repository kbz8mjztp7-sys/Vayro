-- Vyro Management System - Database Schema Reference
-- هذا الملف للمرجع فقط - يتم إنشاء الجداول تلقائيًا عند التشغيل

CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  guild_id TEXT NOT NULL,
  channel_id TEXT UNIQUE NOT NULL,
  creator_id TEXT NOT NULL,
  ticket_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  claimed_by TEXT,
  transferred_to TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  category_id TEXT,
  opening_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  claimed_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ticket_participants (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  added_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(ticket_id, user_id)
);

CREATE TABLE IF NOT EXISTS ticket_actions (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  target_user_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS warnings (
  id SERIAL PRIMARY KEY,
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  moderator_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  removed_at TIMESTAMPTZ,
  removed_by TEXT
);

CREATE TABLE IF NOT EXISTS auto_replies (
  id SERIAL PRIMARY KEY,
  guild_id TEXT NOT NULL,
  trigger_text TEXT NOT NULL,
  response_text TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'contains',
  channel_id TEXT,
  role_id TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  cooldown_seconds INTEGER NOT NULL DEFAULT 30,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(guild_id, trigger_text)
);

CREATE TABLE IF NOT EXISTS server_settings (
  id SERIAL PRIMARY KEY,
  guild_id TEXT NOT NULL UNIQUE,
  welcome_enabled BOOLEAN NOT NULL DEFAULT false,
  welcome_channel_id TEXT,
  welcome_title TEXT DEFAULT 'مرحباً بك! 👋',
  welcome_description TEXT DEFAULT 'مرحباً {user} في سيرفر {server}!',
  welcome_color TEXT DEFAULT '5865F2',
  welcome_image TEXT,
  welcome_thumbnail TEXT,
  welcome_auto_role TEXT,
  goodbye_enabled BOOLEAN NOT NULL DEFAULT false,
  goodbye_channel_id TEXT,
  goodbye_title TEXT DEFAULT 'وداعاً 👋',
  goodbye_description TEXT DEFAULT 'غادرنا {username}',
  goodbye_color TEXT DEFAULT 'ED4245',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_guild ON tickets(guild_id);
CREATE INDEX IF NOT EXISTS idx_tickets_creator ON tickets(creator_id);
CREATE INDEX IF NOT EXISTS idx_tickets_channel ON tickets(channel_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_warnings_user ON warnings(guild_id, user_id);
CREATE INDEX IF NOT EXISTS idx_auto_replies_guild ON auto_replies(guild_id);
