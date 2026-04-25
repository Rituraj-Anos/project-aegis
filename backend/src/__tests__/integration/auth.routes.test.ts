import request from 'supertest';
import app from '../../app';
import { connectTestDb, disconnectTestDb, clearCollections } from '../setup/testDb';

beforeAll(async () => { await connectTestDb(); });
afterAll(async ()  => { await disconnectTestDb(); });
afterEach(async () => { await clearCollections(); });

describe('Auth Routes', () => {
  const validUser = { email: 'auth@test.com', password: 'Password1!', name: 'Auth User' };

  describe('POST /api/v1/auth/register', () => {
    it('201 — registers and returns accessToken', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(validUser);
      expect(res.status).toBe(201);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe(validUser.email);
      expect(res.body.data.user.role).toBe('user');
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('409 — duplicate email', async () => {
      await request(app).post('/api/v1/auth/register').send(validUser);
      const res = await request(app).post('/api/v1/auth/register').send(validUser);
      expect(res.status).toBe(409);
    });

    it('400 — weak password', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({ ...validUser, password: 'weak' });
      expect(res.status).toBe(400);
    });

    it('400 — invalid email', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({ ...validUser, email: 'notanemail' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(validUser);
    });

    it('200 — valid credentials', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({ email: validUser.email, password: validUser.password });
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('401 — wrong password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({ email: validUser.email, password: 'WrongPass1!' });
      expect(res.status).toBe(401);
    });

    it('401 — non-existent email', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({ email: 'nobody@test.com', password: 'Password1!' });
      expect(res.status).toBe(401);
    });
  });

  describe('Route protection', () => {
    it('401 — protected routes reject missing token', async () => {
      const res = await request(app).get('/api/v1/accounts');
      expect(res.status).toBe(401);
    });

    it('401 — protected routes reject malformed token', async () => {
      const res = await request(app).get('/api/v1/accounts').set('Authorization', 'Bearer invalid');
      expect(res.status).toBe(401);
    });
  });
});
