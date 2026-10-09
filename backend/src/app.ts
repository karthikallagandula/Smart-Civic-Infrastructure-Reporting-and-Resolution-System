import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import env from './config/env';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error';
import { aiEnabled } from './services/ai';
import { storageMode } from './services/storage';

export interface AppInfo {
  demoMode: boolean;
  notice: string;
  demoAccounts?: { role: string; email: string; password: string }[];
}

export function createApp(info: AppInfo) {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.use(
    '/api',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 600,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { error: 'Too many requests. Please slow down and try again shortly.' },
    })
  );

  app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      demoMode: info.demoMode,
      notice: info.notice,
      uploadMode: storageMode(),
      aiEnabled: aiEnabled(),
      demoAccounts: info.demoMode ? info.demoAccounts : undefined,
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api', routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
