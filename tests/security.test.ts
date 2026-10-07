import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import './setup.js';

/**
 * Tests des mesures de sécurité (étape 6).
 */
describe('Sécurité', () => {
  const app = createApp();

  it('Helmet ajoute les en-têtes de sécurité et masque X-Powered-By', async () => {
    const response = await request(app).get('/health').expect(200);

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['strict-transport-security']).toBeDefined();
    expect(response.headers['content-security-policy']).toContain("default-src 'none'");
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it.each([
    ['get', '/api/columns'],
    ['post', '/api/columns'],
    ['get', '/api/ofs'],
    ['delete', '/api/ofs/507f1f77bcf86cd799439011'],
  ] as const)('%s %s renvoie 401 sans authentification', async (method, url) => {
    const response = await request(app)[method](url).expect(401);
    expect(response.body).toHaveProperty('error');
  });

  it('le rate limiter renvoie 429 après trop de tentatives de login', async () => {
    const limitedApp = createApp({ authMax: 3, windowMs: 60_000 });
    const credentials = { email: 'attacker@example.com', password: 'wrong' };

    for (let i = 0; i < 3; i++) {
      await request(limitedApp).post('/api/auth/login').send(credentials).expect(401);
    }

    const response = await request(limitedApp)
      .post('/api/auth/login')
      .send(credentials)
      .expect(429);

    expect(response.body).toHaveProperty('error');
    expect(response.headers['ratelimit']).toBeDefined();
  });
});
