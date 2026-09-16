import cors from 'cors';
import dotenv from 'dotenv';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import contactRoutes from './routes/contact.js';
import { closeDatabase, testConnection } from './services/database.js';
import { assertTelegramConfig, getTelegramConfig } from './services/telegram.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { startWorker, stopWorker } from './workers/telegram-worker.js';
import logger, { apiLogger } from './utils/logger.js';
import { isAppError, toAppError } from './utils/errors.js';

dotenv.config({ path: resolve(fileURLToPath(new URL('../../.env', import.meta.url))) });

export function createApp(): Express {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet());

  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((value) => value.trim())
    : ['http://localhost:8888', 'http://localhost:5173'];
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') callback(null, true);
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
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    }));
    next();
  });

  app.get('/live', (_req, res) => res.json({ status: 'ok' }));
  app.get('/ready', async (_req, res) => {
    const database = await testConnection();
    const telegram = Boolean(getTelegramConfig());
    return res.status(database && telegram ? 200 : 503).json({
      status: database && telegram ? 'ready' : 'not_ready', database, telegram,
    });
  });
  app.use('/api/contact', contactRoutes);

  app.use((req, res) => res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Маршрут не найден' },
    requestId: req.requestId,
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
  if (process.env.NODE_ENV === 'production') assertTelegramConfig();
  const databaseReady = await testConnection();
  if (!databaseReady) throw new Error('SQLite is not ready; run migrations before starting the backend');

  const port = Number(process.env.API_PORT || 9000);
  const server = createApp().listen(port, () => {
    logger.info('Backend API server started', { port });
    if (getTelegramConfig()) startWorker();
    else logger.warn('Telegram configuration is missing; worker is disabled');
  });

  const shutdown = async (signal: string) => {
    logger.info('Shutdown requested', { signal });
    stopWorker();
    server.close(async () => {
      await closeDatabase();
      process.exit(0);
    });
  };
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
  process.once('SIGINT', () => void shutdown('SIGINT'));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startServer().catch((error) => {
    logger.error('Backend startup failed', { error: error instanceof Error ? error.message : String(error) });
    process.exitCode = 1;
  });
}
