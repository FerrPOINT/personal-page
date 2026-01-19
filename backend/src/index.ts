import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { testConnection, closeDatabase } from './services/database.js';
import { testTelegramConnection } from './services/telegram.js';
import contactRoutes from './routes/contact.js';
import { startWorker, stopWorker } from './workers/telegram-worker.js';
import { getTelegramChatId } from './models/BotSettings.js';

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

// Body parsing
app.use(express.json({ limit: '1mb' })); // Limit request body size

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
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
    let error = null;
    
    if (tokenSet) {
      try {
        telegramConnected = await testTelegramConnection();
        // Try to get bot info if connected
        if (telegramConnected) {
          // We can't directly access bot here, but testTelegramConnection already checked
          botUsername = 'connected';
        }
      } catch (err: any) {
        error = err.message || err.toString();
      }
    }
    
    res.json({
      success: true,
      telegram: {
        tokenConfigured: tokenSet,
        tokenLength: tokenLength,
        userIdConfigured: userIdSet,
        userId: userIdSet ? process.env.TELEGRAM_USER_ID : null,
        chatIdRegistered: chatIdRegistered,
        chatId: chatId,
        botConnected: telegramConnected,
        botUsername: botUsername,
        error: error,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error',
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

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message || 'An unexpected error occurred',
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  stopWorker();
  await closeDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  stopWorker();
  await closeDatabase();
  process.exit(0);
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Backend API server running on port ${PORT}`);
  
  // Test database connection on startup
  const dbConnected = await testConnection();
  if (dbConnected) {
    console.log('✅ Database connection verified');
  } else {
    console.warn('⚠️  Database connection failed - check DATABASE_PATH');
  }

  // Test Telegram connection on startup (if token is set)
  if (process.env.TELEGRAM_BOT_TOKEN) {
    const telegramConnected = await testTelegramConnection();
    if (telegramConnected) {
      // Start worker if Telegram is configured
      startWorker();
      console.log('💡 Tip: Send a message to your Telegram bot to register your user ID');
    } else {
      console.warn('⚠️  Telegram connection failed - worker will not start');
    }
  } else {
    console.warn('⚠️  TELEGRAM_BOT_TOKEN not set - worker will not start');
  }
});

