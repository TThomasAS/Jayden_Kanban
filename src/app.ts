import express, { Express } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import {
  securityHeaders,
  apiRateLimiter,
  authRateLimiter,
  type SecurityOptions,
} from './middlewares/security.middleware.js';

/**
 * Creates and configures the Express application.
 *
 * Sets up security middleware (Helmet, rate limiting), CORS, JSON parsing and routes.
 * Error handler must be the last middleware.
 * Exported for use in server.ts and testing.
 *
 * @param security - Optional overrides for rate limiting (used in tests)
 * @returns Configured Express application
 */
export function createApp(security: SecurityOptions = {}): Express {
  const app = express();

  // Derrière un reverse proxy, permet à express-rate-limit de lire la vraie IP client
  if (env.TRUST_PROXY > 0) {
    app.set('trust proxy', env.TRUST_PROXY);
  }

  // --- Sécurité ---
  app.disable('x-powered-by');
  app.use(securityHeaders());
  app.use('/api', apiRateLimiter(security)); 
  app.use('/api/auth', authRateLimiter(security));

  // Middleware
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: '100kb' })); 
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));

  // Request logging
  app.use((req, res, next) => {
    logger.info({ method: req.method, url: req.url }, 'Incoming request');
    next();
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use('/api', routes);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
