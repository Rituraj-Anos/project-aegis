import request from 'supertest';
import app from '../../app';
import { connectTestDb, disconnectTestDb } from '../setup/testDb';

beforeAll(async () => { await connectTestDb(); });
afterAll(async ()  => { await disconnectTestDb(); });

describe('Health Routes', () => {
  describe('GET /health', () => {
    it('200 — returns status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ok');
    });
  });
});
