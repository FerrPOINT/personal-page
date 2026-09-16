-- Durable Telegram delivery queue.
ALTER TABLE messages ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE messages ADD COLUMN next_attempt_at TEXT NULL;
ALTER TABLE messages ADD COLUMN processing_started_at TEXT NULL;

-- Legacy failures are historical and must not be sent unexpectedly after upgrade.
UPDATE messages SET status = 'dead', next_attempt_at = NULL WHERE status = 'failed';
UPDATE messages SET next_attempt_at = created_at WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_messages_queue
ON messages(status, next_attempt_at, created_at);
