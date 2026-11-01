process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-32-bytes-long!';
process.env.JWT_EXPIRES_IN = '1h';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const { getDatabase, resetDatabase, closeDatabase } = require('../database/db');

describe('Child Health API — Comprehensive Security & Authentication Test Suite', () => {
  let tokenUser1;
  let tokenUser2;

  beforeAll(() => {
    getDatabase();
  });

  beforeEach(async () => {
    resetDatabase();

    // Authenticate test users to acquire valid signed JWTs
    const loginUser1 = await request(app)
      .post('/auth/login')
      .send({ email: 'user1@example.com', password: 'user1' });
    tokenUser1 = loginUser1.body.token;

    const loginUser2 = await request(app)
      .post('/auth/login')
      .send({ email: 'user2@example.com', password: 'user2' });
    tokenUser2 = loginUser2.body.token;
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

    test('Response includes Helmet security headers and CORS', async () => {
      const res = await request(app).get('/health');

      expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(res.headers).toHaveProperty('x-frame-options', 'SAMEORIGIN');
      expect(res.headers).toHaveProperty('strict-transport-security');
      expect(res.headers).toHaveProperty('access-control-allow-origin');
    });

    test('Response includes RateLimit headers', async () => {
      const res = await request(app).get('/health');

      expect(res.headers).toHaveProperty('ratelimit-limit');
      expect(res.headers).toHaveProperty('ratelimit-remaining');
    });
  });

  // 2. Authentication & JWT Issuance (Register & Login)
  describe('JWT Authentication Endpoints (POST /auth/register & POST /auth/login)', () => {
    test('Successfully register a new guardian and receive a signed JWT', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'Sunita Rao',
          email: 'sunita.rao@example.com',
          password: 'SecurePassword123'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.guardian.email).toBe('sunita.rao@example.com');
      expect(res.body.expiresIn).toBe('1h');

      // Verify JWT structure, algorithm (HS256), and claims
      const decoded = jwt.decode(res.body.token, { complete: true });
      expect(decoded.header.alg).toBe('HS256');
      expect(decoded.payload.sub).toBe(res.body.guardian.id);
      expect(decoded.payload.iss).toBe('child-health-api');
      expect(decoded.payload.aud).toBe('child-health-api');
      expect(decoded.payload).not.toHaveProperty('email'); // Data minimization
      expect(decoded.payload).not.toHaveProperty('password');
    });

    test('Reject registration with duplicate email address', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'Duplicate User',
          email: 'user1@example.com', // Already seeded
          password: 'Password123'
        });

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('error', 'Conflict');
      expect(res.body.message).toContain('already exists');
    });

    test('Reject registration with password exceeding 72 bytes (bcrypt limitation)', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'Long Password User',
          email: 'longpass@example.com',
          password: 'A'.repeat(75) // Exceeds 72 bytes
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Validation Error');
      expect(res.body.details.some(d => d.includes('72 bytes'))).toBe(true);
    });

    test('Successfully login with email and receive a signed JWT', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'user1@example.com',
          password: 'user1'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.guardian.id).toBe('guardian-user1');
      expect(res.body.expiresIn).toBe('1h');
    });

    test('Successfully login with shorthand username', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          username: 'user3',
          password: 'user3'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.guardian.id).toBe('guardian-user3');
    });

    test('Reject login with incorrect password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'user1@example.com',
          password: 'wrong-password'
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Unauthorized');
      expect(res.body.message).toContain('Invalid email or password');
    });

    test('Reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'any-password'
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Unauthorized');
      expect(res.body.message).toContain('Invalid email or password');
    });
  });

  // 3. JWT Verification & Token Tampering
  describe('JWT Verification & Integrity', () => {
    test('Reject requests with missing Authorization header', async () => {
      const res = await request(app)
        .post('/children')
        .send({ name: 'Baby John' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Unauthorized');
    });

    test('Reject requests with tampered JWT signature', async () => {
      // Create a token signed with an invalid secret
      const fakeToken = jwt.sign(
        { sub: 'guardian-user1', iss: 'child-health-api', aud: 'child-health-api' },
        'wrong-secret-key-that-does-not-match',
        { algorithm: 'HS256', expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/children/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${fakeToken}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid or tampered');
    });

    test('Reject requests with expired JWT', async () => {
      // Create an expired token (expires in -10 seconds)
      const expiredToken = jwt.sign(
        { sub: 'guardian-user1', iss: 'child-health-api', aud: 'child-health-api' },
        process.env.JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '-10s' }
      );

      const res = await request(app)
        .get('/children/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('expired');
    });

    test('Reject token with mismatched audience or issuer', async () => {
      const wrongAudToken = jwt.sign(
        { sub: 'guardian-user1', iss: 'child-health-api', aud: 'wrong-audience' },
        process.env.JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/children/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${wrongAudToken}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid or tampered');
    });
  });

  // 4. Resource Ownership Enforcement
  describe('Resource Ownership Enforcement', () => {
    test('Successfully register child under authenticated user1', async () => {
      const payload = {
        name: 'Aarav Sharma',
        dateOfBirth: '2023-04-12',
        guardianName: 'User One',
        state: 'Maharashtra',
        consentStatus: true
      };

      const res = await request(app)
        .post('/children')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Aarav Sharma');
      expect(res.body.consentStatus).toBe('granted');
    });

    test('User 1 can retrieve their registered child', async () => {
      const registerRes = await request(app)
        .post('/children')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({
          name: 'Aarav Sharma',
          dateOfBirth: '2023-04-12',
          guardianName: 'User One',
          state: 'Maharashtra',
          consentStatus: 'granted'
        });

      const childId = registerRes.body.id;

      const res = await request(app)
        .get(`/children/${childId}`)
        .set('Authorization', `Bearer ${tokenUser1}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(childId);
    });

    test('Reject cross-guardian access (User 2 cannot retrieve User 1 child)', async () => {
      const registerRes = await request(app)
        .post('/children')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({
          name: 'Aarav Sharma',
          dateOfBirth: '2023-04-12',
          guardianName: 'User One',
          state: 'Maharashtra',
          consentStatus: 'granted'
        });

      const childId = registerRes.body.id;

      // User 2 attempts to view User 1's child
      const res = await request(app)
        .get(`/children/${childId}`)
        .set('Authorization', `Bearer ${tokenUser2}`);

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error', 'Forbidden');
      expect(res.body.message).toContain('Access denied');
    });

    test('Reject cross-guardian reminder creation (User 2 cannot schedule for User 1 child)', async () => {
      const registerRes = await request(app)
        .post('/children')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({
          name: 'Aarav Sharma',
          dateOfBirth: '2023-04-12',
          guardianName: 'User One',
          state: 'Maharashtra',
          consentStatus: 'granted'
        });

      const childId = registerRes.body.id;

      // User 2 attempts to schedule reminder for User 1's child
      const res = await request(app)
        .post('/reminders')
        .set('Authorization', `Bearer ${tokenUser2}`)
        .send({
          childId: childId,
          vaccineName: 'Polio',
          dueDate: '2026-12-15',
          status: 'scheduled'
        });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error', 'Forbidden');
      expect(res.body.message).toContain('cannot create reminders for a child you do not manage');
    });
  });

  // 5. Consent Enforcement & Payload Protection
  describe('Consent Protection & Payload Limits', () => {
    test('Reject reminder creation when consent is denied', async () => {
      const childRes = await request(app)
        .post('/children')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({
          name: 'Baby Denied',
          dateOfBirth: '2023-05-15',
          guardianName: 'User One',
          state: 'Maharashtra',
          consentStatus: 'denied'
        });

      const res = await request(app)
        .post('/reminders')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({
          childId: childRes.body.id,
          vaccineName: 'MMR',
          dueDate: '2026-11-20',
          status: 'scheduled'
        });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error', 'Consent Required');
    });

    test('Successfully create reminder when consent is granted', async () => {
      const childRes = await request(app)
        .post('/children')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({
          name: 'Baby Granted',
          dateOfBirth: '2023-05-15',
          guardianName: 'User One',
          state: 'Maharashtra',
          consentStatus: 'granted'
        });

      const res = await request(app)
        .post('/reminders')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({
          childId: childRes.body.id,
          vaccineName: 'BCG',
          dueDate: '2026-11-20',
          status: 'scheduled'
        });

      expect(res.status).toBe(201);
      expect(res.body.vaccineName).toBe('BCG');
    });

    test('Reject payload exceeding 10kb body size limit', async () => {
      const res = await request(app)
        .post('/children')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({
          name: 'A'.repeat(15000),
          dateOfBirth: '2023-04-12',
          guardianName: 'User One',
          state: 'Maharashtra',
          consentStatus: 'granted'
        });

      expect(res.status).toBe(413);
      expect(res.body).toHaveProperty('error', 'Payload Too Large');
    });
  });
});
