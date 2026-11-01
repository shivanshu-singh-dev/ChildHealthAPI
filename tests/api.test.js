process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const { getDatabase, resetDatabase, closeDatabase } = require('../database/db');

describe('Child Health API — Security and Functionality Test Suite', () => {
  const tokenPriya = 'mock-token-priya';
  const tokenRohit = 'mock-token-rohit';

  beforeAll(() => {
    getDatabase();
  });

  beforeEach(() => {
    resetDatabase();
  });

  afterAll(() => {
    closeDatabase();
  });

  // 1. Health check & Security Headers
  describe('System Health & Security Headers', () => {
    test('Public health check returns 200 without authentication', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'UP');
      expect(res.body).toHaveProperty('database', 'connected');
    });

    test('Response includes Helmet security headers', async () => {
      const res = await request(app).get('/health');

      expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(res.headers).toHaveProperty('x-frame-options', 'SAMEORIGIN');
      expect(res.headers).toHaveProperty('strict-transport-security');
    });

    test('Response includes RateLimit headers', async () => {
      const res = await request(app).get('/health');

      expect(res.headers).toHaveProperty('ratelimit-limit');
      expect(res.headers).toHaveProperty('ratelimit-remaining');
    });
  });

  // 2. Identity & Access Control (Authentication)
  describe('Authentication Enforcement', () => {
    test('Reject requests with missing Authorization header', async () => {
      const res = await request(app)
        .post('/children')
        .send({
          name: 'Ananya Sen',
          dateOfBirth: '2023-11-20',
          guardianName: 'Priya Sharma',
          state: 'Karnataka',
          consentStatus: true
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Unauthorized');
      expect(res.body.message).toContain('Authorization header is required');
    });

    test('Reject requests with invalid or unrecognized token', async () => {
      const res = await request(app)
        .get('/children/00000000-0000-0000-0000-000000000000')
        .set('Authorization', 'Bearer invalid-expired-token');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Unauthorized');
      expect(res.body.message).toContain('Invalid or expired');
    });

    test('Reject requests with malformed Authorization scheme', async () => {
      const res = await request(app)
        .post('/children')
        .set('Authorization', 'Basic dXNlcjpwYXNz')
        .send({});

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Unauthorized');
      expect(res.body.message).toContain('Bearer');
    });
  });

  // 3. Child Registration & Ownership
  describe('Child Registration & Ownership Enforcement', () => {
    test('Successfully register child under authenticated guardian', async () => {
      const payload = {
        name: 'Aarav Sharma',
        dateOfBirth: '2023-04-12',
        guardianName: 'Priya Sharma',
        state: 'Maharashtra',
        consentStatus: true
      };

      const res = await request(app)
        .post('/children')
        .set('Authorization', `Bearer ${tokenPriya}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Aarav Sharma');
      expect(res.body.consentStatus).toBe('granted'); // Standardized boolean true -> 'granted'
      expect(res.body).not.toHaveProperty('authToken'); // Never leak sensitive auth tokens
    });

    test('Authenticated guardian can retrieve their registered child', async () => {
      const registerRes = await request(app)
        .post('/children')
        .set('Authorization', `Bearer ${tokenPriya}`)
        .send({
          name: 'Aarav Sharma',
          dateOfBirth: '2023-04-12',
          guardianName: 'Priya Sharma',
          state: 'Maharashtra',
          consentStatus: 'granted'
        });

      const childId = registerRes.body.id;

      const res = await request(app)
        .get(`/children/${childId}`)
        .set('Authorization', `Bearer ${tokenPriya}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(childId);
      expect(res.body.name).toBe('Aarav Sharma');
    });

    test('Reject cross-guardian access (Guardian B cannot access Guardian A child)', async () => {
      // Registered by Priya
      const registerRes = await request(app)
        .post('/children')
        .set('Authorization', `Bearer ${tokenPriya}`)
        .send({
          name: 'Aarav Sharma',
          dateOfBirth: '2023-04-12',
          guardianName: 'Priya Sharma',
          state: 'Maharashtra',
          consentStatus: 'granted'
        });

      const childId = registerRes.body.id;

      // Rohit attempts to retrieve Priya's child
      const res = await request(app)
        .get(`/children/${childId}`)
        .set('Authorization', `Bearer ${tokenRohit}`);

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error', 'Forbidden');
      expect(res.body.message).toContain('Access denied');
    });

    test('Return 404 for a nonexistent child for authenticated guardian', async () => {
      const nonexistentId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`/children/${nonexistentId}`)
        .set('Authorization', `Bearer ${tokenPriya}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Child not found');
    });
  });

  // 4. Vaccination Reminder Ownership & Consent Enforcement
  describe('Vaccination Reminders & Consent Protection', () => {
    let priyaChildId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/children')
        .set('Authorization', `Bearer ${tokenPriya}`)
        .send({
          name: 'Diya Sharma',
          dateOfBirth: '2023-02-10',
          guardianName: 'Priya Sharma',
          state: 'Maharashtra',
          consentStatus: 'granted'
        });
      priyaChildId = res.body.id;
    });

    test('Successfully create a reminder for owned child with granted consent', async () => {
      const res = await request(app)
        .post('/reminders')
        .set('Authorization', `Bearer ${tokenPriya}`)
        .send({
          childId: priyaChildId,
          vaccineName: 'Polio Booster',
          dueDate: '2026-12-15',
          status: 'scheduled'
        });

      expect(res.status).toBe(201);
      expect(res.body.childId).toBe(priyaChildId);
      expect(res.body.vaccineName).toBe('Polio Booster');
      expect(res.body.status).toBe('scheduled');
    });

    test('Reject unauthorized reminder creation by a different guardian', async () => {
      // Rohit tries to create reminder for Priya's child
      const res = await request(app)
        .post('/reminders')
        .set('Authorization', `Bearer ${tokenRohit}`)
        .send({
          childId: priyaChildId,
          vaccineName: 'BCG',
          dueDate: '2026-12-15',
          status: 'scheduled'
        });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error', 'Forbidden');
      expect(res.body.message).toContain('cannot create reminders for a child you do not manage');
    });

    test('Reject reminder creation when consent is denied', async () => {
      // Register child with denied consent
      const deniedChildRes = await request(app)
        .post('/children')
        .set('Authorization', `Bearer ${tokenPriya}`)
        .send({
          name: 'Baby Without Consent',
          dateOfBirth: '2023-05-15',
          guardianName: 'Priya Sharma',
          state: 'Maharashtra',
          consentStatus: 'denied'
        });

      const res = await request(app)
        .post('/reminders')
        .set('Authorization', `Bearer ${tokenPriya}`)
        .send({
          childId: deniedChildRes.body.id,
          vaccineName: 'MMR',
          dueDate: '2026-11-20',
          status: 'scheduled'
        });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error', 'Consent Required');
      expect(res.body.message).toContain('Active granted consent is required');
    });

    test('Reject reminder creation when consent is revoked', async () => {
      // Register child with revoked consent
      const revokedChildRes = await request(app)
        .post('/children')
        .set('Authorization', `Bearer ${tokenPriya}`)
        .send({
          name: 'Baby Revoked',
          dateOfBirth: '2023-05-15',
          guardianName: 'Priya Sharma',
          state: 'Maharashtra',
          consentStatus: 'revoked'
        });

      const res = await request(app)
        .post('/reminders')
        .set('Authorization', `Bearer ${tokenPriya}`)
        .send({
          childId: revokedChildRes.body.id,
          vaccineName: 'Measles',
          dueDate: '2026-11-20',
          status: 'scheduled'
        });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error', 'Consent Required');
    });

    test('Reject reminder for a nonexistent child', async () => {
      const nonexistentId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .post('/reminders')
        .set('Authorization', `Bearer ${tokenPriya}`)
        .send({
          childId: nonexistentId,
          vaccineName: 'BCG',
          dueDate: '2026-11-20',
          status: 'scheduled'
        });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Child not found');
    });

    test('Reject invalid reminder date', async () => {
      const res = await request(app)
        .post('/reminders')
        .set('Authorization', `Bearer ${tokenPriya}`)
        .send({
          childId: priyaChildId,
          vaccineName: 'Rotavirus',
          dueDate: '2026-02-30', // Invalid calendar date
          status: 'scheduled'
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Validation Error');
    });
  });

  // 5. Input Validation & Body Limit Protection
  describe('Input Validation & Payload Protection', () => {
    test('Reject registration missing mandatory fields', async () => {
      const res = await request(app)
        .post('/children')
        .set('Authorization', `Bearer ${tokenPriya}`)
        .send({
          name: 'Incomplete Record'
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Validation Error');
      expect(res.body.details.length).toBeGreaterThanOrEqual(4);
    });

    test('Reject registration with whitespace-only strings', async () => {
      const res = await request(app)
        .post('/children')
        .set('Authorization', `Bearer ${tokenPriya}`)
        .send({
          name: '   ',
          dateOfBirth: '2023-04-12',
          guardianName: '   ',
          state: '   ',
          consentStatus: 'granted'
        });

      expect(res.status).toBe(400);
      expect(res.body.details.some(d => d.includes('cannot be empty'))).toBe(true);
    });

    test('Reject payload exceeding the 10kb body size limit', async () => {
      const largePayload = {
        name: 'A'.repeat(15000), // Over 10kb
        dateOfBirth: '2023-04-12',
        guardianName: 'Priya Sharma',
        state: 'Maharashtra',
        consentStatus: 'granted'
      };

      const res = await request(app)
        .post('/children')
        .set('Authorization', `Bearer ${tokenPriya}`)
        .send(largePayload);

      expect(res.status).toBe(413);
      expect(res.body).toHaveProperty('error', 'Payload Too Large');
    });

    test('Gracefully handle malformed JSON syntax', async () => {
      const res = await request(app)
        .post('/children')
        .set('Authorization', `Bearer ${tokenPriya}`)
        .set('Content-Type', 'application/json')
        .send('{ "name": "Broken JSON", ');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Malformed JSON');
    });
  });
});
