import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { z } from 'zod';

// Config
import connectDB from './config/db.js';
import { getRedisClient } from './config/redis.js';
import configurePassport from './config/passport.js';
import logger from './config/logger.js';

// Middlewares
import { requestId, httpLogger } from './middlewares/requestLogger.middleware.js';
import errorHandler from './middlewares/errorHandler.middleware.js';
import { apiLimiter } from './middlewares/rateLimiter.middleware.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import messageRoutes from './routes/message.routes.js';
import conversationRoutes from './routes/conversation.routes.js';
import groupRoutes from './routes/group.routes.js';
import friendRoutes from './routes/friend.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import uploadRoutes from './routes/upload.routes.js';

// ========================
// Environment Validation
// ========================
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().default(6379),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  ENCRYPTION_KEY: z.string().min(64, 'ENCRYPTION_KEY must be 64 hex chars (32 bytes)'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
});

const envValidation = envSchema.safeParse(process.env);
if (!envValidation.success) {
  const errors = envValidation.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
  logger.error(`Environment validation failed:\n${errors.join('\n')}`);
  process.exit(1);
}

// ========================
// Create Express App
// ========================
const app = express();

// Trust proxy (for rate limiting IP detection behind Nginx)
app.set('trust proxy', 1);

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", process.env.FRONTEND_URL],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [
        process.env.FRONTEND_URL,
        'http://localhost:5173',
        'http://localhost:3000',
      ];
      if (!origin || allowed.includes(origin)) return callback(null, true);
      callback(new Error(`CORS policy violation: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'Retry-After'],
  })
);

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing
app.use(cookieParser());

// Request ID + HTTP logging
app.use(requestId);
app.use(httpLogger);

// Passport initialization (no sessions — JWT only)
configurePassport();
app.use(passport.initialize());

// ========================
// Health Check
// ========================
app.get('/api/health', async (req, res) => {
  try {
    const { checkDBConnection } = await import('./config/db.js');
    const { checkRedisConnection } = await import('./config/redis.js');

    const dbStatus = checkDBConnection();
    const redisStatus = await checkRedisConnection();

    res.json({
      success: true,
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      db: dbStatus,
      redis: redisStatus,
      environment: process.env.NODE_ENV,
      version: '1.0.0',
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      status: 'error',
      message: err.message,
    });
  }
});

// ========================
// API Routes
// ========================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    code: 'NOT_FOUND',
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// ========================
// DB Connection
// ========================
connectDB();

export default app;
