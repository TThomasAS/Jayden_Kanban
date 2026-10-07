import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Column } from '../src/models/Column.js';
import { createTestUser, getAuthToken, createTestColumn } from './helpers.js';
import './setup.js';

/* Écrire des tests avec Vitest et Supertest pour :
  * GET /api/columns
  * POST /api/columns
*/
const app = createApp();

describe('Columns Routes', () => {
  let authToken: string;

  beforeEach(async () => {
    const user = await createTestUser(`columns-${Date.now()}@example.com`);
    authToken = getAuthToken(user);
  });

  describe('GET /api/columns', () => {
    it('renvoie 200 et un tableau vide quand aucune colonne', async () => {
      const response = await request(app)
        .get('/api/columns')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({
        message: 'Columns retrieved successfully',
        data: [],
      });
    });

    it('renvoie les colonnes triées par position', async () => {
      await createTestColumn('Terminé', 2);
      await createTestColumn('À faire', 0);
      await createTestColumn('En cours', 1);

      const response = await request(app)
        .get('/api/columns')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data.map((c: { name: string }) => c.name)).toEqual([
        'À faire',
        'En cours',
        'Terminé',
      ]);

      // Structure JSON d'une colonne
      const column = response.body.data[0];
      expect(column).toMatchObject({
        _id: expect.any(String),
        name: 'À faire',
        position: 0,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('renvoie 401 sans token', async () => {
      const response = await request(app).get('/api/columns').expect(401);
      expect(response.body).toHaveProperty('error', 'No token provided');
    });

    it('renvoie 401 avec un token invalide', async () => {
      const response = await request(app)
        .get('/api/columns')
        .set('Authorization', 'Bearer token-bidon')
        .expect(401);
      expect(response.body).toHaveProperty('error', 'Invalid or expired token');
    });
  });

  describe('POST /api/columns', () => {
    it('crée une colonne (201) et l’insère en base', async () => {
      const response = await request(app)
        .post('/api/columns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'À faire' })
        .expect('Content-Type', /json/)
        .expect(201);

      // Code + structure JSON
      expect(response.body).toHaveProperty('message', 'Column created successfully');
      expect(response.body.data).toMatchObject({
        _id: expect.any(String),
        name: 'À faire',
        position: 0,
      });

      // Effet en base de données
      const inDb = await Column.findById(response.body.data._id).lean();
      expect(inDb).not.toBeNull();
      expect(inDb?.name).toBe('À faire');
      expect(await Column.countDocuments()).toBe(1);
    });

    it('place la nouvelle colonne en dernière position', async () => {
      await createTestColumn('À faire', 0);
      await createTestColumn('En cours', 1);

      const response = await request(app)
        .post('/api/columns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Terminé' })
        .expect(201);

      expect(response.body.data.position).toBe(2);
      expect(await Column.countDocuments()).toBe(3);
    });

    it('renvoie 400 si le nom est absent et n’insère rien', async () => {
      const response = await request(app)
        .post('/api/columns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation error');
      expect(response.body.details[0]).toHaveProperty('path', 'name');
      expect(await Column.countDocuments()).toBe(0);
    });

    it('renvoie 400 si le nom existe déjà (index unique)', async () => {
      await Column.init(); 
      await createTestColumn('Doublon', 0);

      const response = await request(app)
        .post('/api/columns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Doublon' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Duplicate entry');
      expect(await Column.countDocuments()).toBe(1);
    });

    it('renvoie 401 sans token et n’insère rien', async () => {
      await request(app).post('/api/columns').send({ name: 'Pirate' }).expect(401);
      expect(await Column.countDocuments()).toBe(0);
    });
  });
});
