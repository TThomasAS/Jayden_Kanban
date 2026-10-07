import type { RequestHandler } from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';

/**
 * Options de sécurité 
 */
export interface SecurityOptions {
  windowMs?: number;
  apiMax?: number;
  authMax?: number;
}

/**
 * En-têtes HTTP de sécurité via Helmet.
 */
export function securityHeaders(): RequestHandler {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
  });
}

/**
 * Limiteur global
 */
export function apiRateLimiter(options: SecurityOptions = {}): RequestHandler {
  return rateLimit({
    windowMs: options.windowMs ?? env.RATE_LIMIT_WINDOW_MS,
    limit: options.apiMax ?? env.RATE_LIMIT_MAX,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  });
}

/**
 * Limiteur strict pour l'authentification 
 */
export function authRateLimiter(options: SecurityOptions = {}): RequestHandler {
  return rateLimit({
    windowMs: options.windowMs ?? env.RATE_LIMIT_WINDOW_MS,
    limit: options.authMax ?? env.AUTH_RATE_LIMIT_MAX,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts, please try again later.' },
  });
}
