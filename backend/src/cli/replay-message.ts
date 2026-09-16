import { replayDeadMessage } from '../models/Message.js';
import { closeDatabase } from '../services/database.js';

const messageId = process.argv[2];
if (!messageId) {
  console.error('Usage: npm run message:replay -- <message-id>');
  process.exitCode = 2;
} else {
  replayDeadMessage(messageId)
    .then((message) => console.log(`Message ${message.id} queued for retry`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    })
    .finally(() => closeDatabase());
}
