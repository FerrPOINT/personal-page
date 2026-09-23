import cors from 'cors';
import dotenv from 'dotenv';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAppConfig, type AppConfig } from './config.js';
import { MessageRepository } from './models/Message.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { createContactRouter } from './routes/contact.js';
import { closeDatabase, createDatabase, testConnection, type AppDatabase } from './services/database.js';
import { TelegramClient } from './services/telegram.js';
import { QueueWorker } from './workers/telegram-worker.js';
import logger, { apiLogger, configureLogger } from './utils/logger.js';
import { isAppError, toAppError } from './utils/errors.js';

export interface AppDependencies {
  config: AppConfig;
  database: AppDatabase;
  messages: MessageRepository;
}

export function createApp({ config, database, messages }: AppDependencies): Express {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || config.allowedOrigins.includes(origin) || config.nodeEnv === 'development') callback(null, true);
      else callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  }));
  app.use(requestIdMiddleware);
  app.use(express.json({ limit: '64kb' }));
  app.use((req: Request, res: Response, next: NextFunction) => {
    const startedAt = Date.now();
    res.on('finish', () => apiLogger.info('Request completed', {
      requestId: req.requestId, method: req.method, path: req.path,
      statusCode: res.statusCode, durationMs: Date.now() - startedAt,
    }));
    next();
  });

  app.get('/live', (_req, res) => res.json({ status: 'ok' }));
  app.get('/ready', (_req, res) => {
    const databaseReady = testConnection(database);
    const telegramReady = Boolean(config.telegram);
    return res.status(databaseReady && telegramReady ? 200 : 503).json({
      status: databaseReady && telegramReady ? 'ready' : 'not_ready',
      database: databaseReady,
      telegram: telegramReady,
    });
  });
  app.use('/api/contact', createContactRouter(messages));
  app.use((req, res) => res.status(404).json({
    success: false, error: { code: 'NOT_FOUND', message: 'Маршрут не найден' }, requestId: req.requestId,
  }));
  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    const appError = toAppError(err);
    const tooLarge = typeof err === 'object' && err !== null && 'type' in err && err.type === 'entity.too.large';
    const status = tooLarge ? 413 : isAppError(err) ? err.statusCode : 500;
    const code = tooLarge ? 'PAYLOAD_TOO_LARGE' : isAppError(err) ? err.code : 'INTERNAL_ERROR';
    const message = tooLarge ? 'Тело запроса слишком большое'
      : status === 500 ? 'Не удалось сохранить сообщение' : appError.message;
    apiLogger.error('Request failed', {
      requestId: req.requestId, method: req.method, path: req.path, statusCode: status, errorCode: code,
    });
    res.status(status).json({ success: false, error: { code, message }, requestId: req.requestId });
  });
  return app;
}

export async function startServer(): Promise<void> {
  dotenv.config({ path: resolve(fileURLToPath(new URL('../../.env', import.meta.url))) });
  const config = loadAppConfig();
  configureLogger(config.logDir, config.nodeEnv, process.env.LOG_LEVEL);
  const database = createDatabase(config.databasePath);
  if (!testConnection(database)) {
    closeDatabase(database);
    throw new Error('SQLite is not ready; run migrations before starting the backend');
  }
  const messages = new MessageRepository(database);
  const worker = config.telegram ? new QueueWorker(messages, new TelegramClient(config.telegram)) : null;
  const server = createApp({ config, database, messages }).listen(config.port, () => {
    logger.info('Backend API server started', { port: config.port });
    if (worker) worker.start();
    else logger.warn('Telegram configuration is missing; worker is disabled');
  });

  let shutdownStarted = false;
  const shutdown = async (signal: string) => {
    if (shutdownStarted) return;
    shutdownStarted = true;
    logger.info('Shutdown requested', { signal });
    const serverClosed = new Promise<void>((done) => server.close(() => done()));
    await worker?.stop();
    await serverClosed;
    closeDatabase(database);
  };
  process.once('SIGTERM', () => void shutdown('SIGTERM').then(() => process.exit(0)));
  process.once('SIGINT', () => void shutdown('SIGINT').then(() => process.exit(0)));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startServer().catch((error) => {
    logger.error('Backend startup failed', { error: error instanceof Error ? error.message : String(error) });
    process.exitCode = 1;
  });
}
