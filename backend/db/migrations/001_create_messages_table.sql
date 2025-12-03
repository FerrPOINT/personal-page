-- Migration: Create messages table
-- Description: Table for storing contact form messages with status tracking

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    sent_at TEXT NULL,
    error_message TEXT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Bot settings table for storing Telegram chat ID
CREATE TABLE IF NOT EXISTS bot_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for key lookup
CREATE INDEX IF NOT EXISTS idx_bot_settings_key ON bot_settings(key);

-- Insert default chat_id key (will be updated when first message received)
INSERT OR IGNORE INTO bot_settings (key, value) 
VALUES ('telegram_chat_id', '');

