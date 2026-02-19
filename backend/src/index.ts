import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { testConnection, closeDatabase } from './services/database.js';
import { testTelegramConnection } from './services/telegram.js';
import contactRoutes from './routes/contact.js';
import { startWorker, stopWorker } from './workers/telegram-worker.js';
import { getTelegramChatId } from './models/BotSettings.js';
import logger, { apiLogger } from './utils/logger.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { isAppError, toAppError } from './utils/errors.js';

// Load environment variables from project root
// In Docker, variables are already set via docker-compose, dotenv won't override them
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.API_PORT || 9000;

// Security middleware
app.use(helmet());

// CORS configuration
// BEST PRACTICE: Для same-origin запросов (относительный путь /api) CORS не нужен
// Разрешаем запросы без origin (same-origin через nginx proxy) и из разрешенных доменов
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:8888', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Разрешаем запросы без origin (same-origin через nginx proxy)
    // Это запросы с относительным путем /api, которые проксируются nginx
    if (!origin) {
      callback(null, true);
      return;
    }
    
    // Разрешаем запросы из разрешенных доменов
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // В development режиме разрешаем все для удобства разработки
      if (process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// Request ID middleware (must be before logging)
app.use(requestIdMiddleware);

// Body parsing
app.use(express.json({ limit: '1mb' }));

// Request logging middleware with request ID (best practice 2026)
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log request start
  apiLogger.info('Incoming request', {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'error' : res.statusCode >= 300 ? 'warn' : 'info';
    apiLogger[logLevel]('Request completed', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  
  next();
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const dbConnected = await testConnection();
  res.json({
    status: 'ok',
    service: 'personal-page-backend',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Telegram diagnostic endpoint
app.get('/api/telegram/status', async (req: Request, res: Response) => {
  try {
    const tokenSet = !!process.env.TELEGRAM_BOT_TOKEN;
    const tokenLength = process.env.TELEGRAM_BOT_TOKEN?.length || 0;
    const userIdSet = !!process.env.TELEGRAM_USER_ID;
    const chatIdRegistered = !!getTelegramChatId();
    const chatId = getTelegramChatId();
    
    let telegramConnected = false;
    let botUsername = null;
    let userUsername = null;
    let error = null;
    
    if (tokenSet) {
      try {
        // Use detailed test function to get error information
        const { testTelegramConnectionWithDetails, getTelegramUsernameByUserId } = await import('./services/telegram.js');
        const testResult = await testTelegramConnectionWithDetails();
        telegramConnected = testResult.connected;
        botUsername = testResult.username || null;
        
        // Try to get user username by ID if user ID is set
        if (telegramConnected && userIdSet && process.env.TELEGRAM_USER_ID) {
          try {
            userUsername = await getTelegramUsernameByUserId(process.env.TELEGRAM_USER_ID);
          } catch (err: unknown) {
            const appError = toAppError(err);
            logger.warn('Could not get user username by ID', { error: appError.message, userId: process.env.TELEGRAM_USER_ID });
          }
        }
        
        // Always include error if connection failed
        if (!testResult.connected) {
          error = testResult.error || 'Connection test failed but no error message provided';
        }
      } catch (err: unknown) {
        const appError = toAppError(err);
        error = appError.message;
        if (appError.cause && typeof appError.cause === 'object' && 'response' in appError.cause) {
          error += ` (API: ${JSON.stringify((appError.cause as { response?: unknown }).response)})`;
        }
        logger.error('Error in Telegram status endpoint', { error: appError.message, stack: appError.stack });
      }
    }
    
    res.json({
      success: true,
      telegram: {
        tokenConfigured: tokenSet,
        tokenLength: tokenLength,
        userIdConfigured: userIdSet,
        userId: userIdSet ? process.env.TELEGRAM_USER_ID : null,
        userUsername: userUsername,
        chatIdRegistered: chatIdRegistered,
        chatId: chatId,
        botConnected: telegramConnected,
        botUsername: botUsername,
        error: error,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const appError = toAppError(error);
    res.status(500).json({
      success: false,
      error: appError.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Telegram username endpoint
app.get('/api/telegram/username', async (req: Request, res: Response) => {
  try {
    const { getTelegramUsernameByUserId } = await import('./services/telegram.js');
    const userId = process.env.TELEGRAM_USER_ID;
    
    if (!userId) {
      // Return default username even if userId is not configured
      const defaultUsername = 'azhukov7';
      return res.json({
        success: true,
        username: defaultUsername,
        userId: null,
        timestamp: new Date().toISOString(),
      });
    }
    
    const username = await getTelegramUsernameByUserId(userId);
    
    res.json({
      success: true,
      username: username, // Function now always returns a string (never null)
      userId: userId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    // Return default username on error
    const appError = toAppError(error);
    const defaultUsername = process.env.TELEGRAM_DEFAULT_USERNAME || 'azhukov7';
    res.json({
      success: true,
      username: defaultUsername,
      userId: process.env.TELEGRAM_USER_ID || null,
      error: appError.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// API routes
app.use('/api/contact', contactRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler with request ID (best practice 2026)
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  const appError = toAppError(err);
  
  apiLogger.error('Unhandled error', {
    requestId: req.requestId,
    error: appError.message,
    code: appError.code,
    stack: appError.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });
  
  const statusCode = isAppError(err) ? err.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    error: isAppError(err) ? err.code : 'Internal server error',
    message: process.env.NODE_ENV === 'production' && !isAppError(err)
      ? 'An unexpected error occurred'
      : appError.message,
    requestId: req.requestId, // Include request ID in error response for debugging
  });
});

// Handle unhandled promise rejections (critical for production)
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: promise.toString(),
  });
  
  // In production, we might want to exit, but for now just log
  // In development, this helps catch async errors
  if (process.env.NODE_ENV === 'production') {
    logger.error('Unhandled rejection in production - consider restarting');
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  
  // Close database and stop worker before exiting
  stopWorker();
  closeDatabase().finally(() => {
    process.exit(1);
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  stopWorker();
  await closeDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  stopWorker();
  await closeDatabase();
  process.exit(0);
});

// Start server
app.listen(PORT, async () => {
  logger.info('Backend API server starting', { port: PORT });
  
  // Test database connection on startup
  const dbConnected = await testConnection();
  if (dbConnected) {
    logger.info('Database connection verified');
  } else {
    logger.warn('Database connection failed - check DATABASE_PATH');
  }

  // Test Telegram connection on startup (if token is set)
  if (process.env.TELEGRAM_BOT_TOKEN) {
    const telegramConnected = await testTelegramConnection();
    if (telegramConnected) {
      // Start worker if Telegram is configured
      startWorker();
      logger.info('Telegram worker started - send a message to bot to register user ID');
    } else {
      logger.warn('Telegram connection failed - worker will not start');
    }
  } else {
    logger.warn('TELEGRAM_BOT_TOKEN not set - worker will not start');
  }
});

