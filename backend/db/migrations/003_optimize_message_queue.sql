-- Keep every deliverable row claimable and align indexes with queue access paths.
UPDATE messages
SET next_attempt_at = created_at
WHERE status IN ('pending', 'failed') AND next_attempt_at IS NULL;

DROP INDEX IF EXISTS idx_messages_queue;

CREATE INDEX IF NOT EXISTS idx_messages_due
ON messages(next_attempt_at, created_at)
WHERE status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS idx_messages_stale_processing
ON messages(processing_started_at)
WHERE status = 'processing';
