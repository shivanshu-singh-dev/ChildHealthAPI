process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const { getDatabase, resetDatabase, closeDatabase } = require('../database/db');

describe('Child Health API — Level 2 Test Suite', () => {
  beforeAll(() => {
    getDatabase();
  });

  beforeEach(() => {
    resetDatabase();
  });

  afterAll(() => {
    closeDatabase();
  });

  // 1. Health check
  describe('GET /health', () => {
    test('8. Return a successful health check', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'UP');
      expect(res.body).toHaveProperty('service', 'Child Health API');
      expect(res.body).toHaveProperty('database', 'connected');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  // 2. Child Registration
  describe('POST /children', () => {
    test('1. Register a child successfully', async () => {
      const payload = {
        name: 'Aarav Sharma',
        dateOfBirth: '2023-04-12',
        guardianName: 'Priya Sharma',
        state: 'Maharashtra',
        consentStatus: true
      };

      const res = await request(app)
        .post('/children')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(typeof res.body.id).toBe('string');
      expect(res.body.name).toBe('Aarav Sharma');
      expect(res.body.dateOfBirth).toBe('2023-04-12');
      expect(res.body.guardianName).toBe('Priya Sharma');
      expect(res.body.state).toBe('Maharashtra');
      expect(res.body.consentStatus).toBe(true);
      expect(res.body).toHaveProperty('createdAt');
    });

    test('2. Reject registration with missing fields', async () => {
      const invalidPayload = {
        name: 'Incomplete Record'
        // Missing dateOfBirth, guardianName, state, consentStatus
      };

      const res = await request(app)
        .post('/children')
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Validation Error');
      expect(Array.isArray(res.body.details)).toBe(true);
      expect(res.body.details.length).toBeGreaterThanOrEqual(4);
    });

    test('Reject registration with empty strings', async () => {
      const payload = {
        name: '   ',
        dateOfBirth: '2023-04-12',
        guardianName: '  ',
        state: '  ',
        consentStatus: true
      };

      const res = await request(app)
        .post('/children')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
      expect(res.body.details.some(d => d.includes('cannot be empty'))).toBe(true);
    });

    test('Reject registration with invalid date format or future date', async () => {
      // Invalid format
      const resFormat = await request(app)
        .post('/children')
        .send({
          name: 'Baby John',
          dateOfBirth: '12-04-2023',
          guardianName: 'Jane Doe',
          state: 'Delhi',
          consentStatus: true
        });

      expect(resFormat.status).toBe(400);
      expect(resFormat.body.details.some(d => d.includes('valid calendar date'))).toBe(true);

      // Future date
      const resFuture = await request(app)
        .post('/children')
        .send({
          name: 'Future Baby',
          dateOfBirth: '2099-01-01',
          guardianName: 'Jane Doe',
          state: 'Delhi',
          consentStatus: true
        });

      expect(resFuture.status).toBe(400);
      expect(resFuture.body.details.some(d => d.includes('cannot be a future date'))).toBe(true);
    });

    test('Reject registration with invalid consent value', async () => {
      const res = await request(app)
        .post('/children')
        .send({
          name: 'Aarav Sharma',
          dateOfBirth: '2023-04-12',
          guardianName: 'Priya Sharma',
          state: 'Maharashtra',
          consentStatus: 'not-a-valid-consent'
        });

      expect(res.status).toBe(400);
      expect(res.body.details.some(d => d.includes('consentStatus'))).toBe(true);
    });
  });

  // 3. Retrieve Child Profile
  describe('GET /children/:id', () => {
    test('3. Retrieve an existing child', async () => {
      // Register first
      const registerRes = await request(app)
        .post('/children')
        .send({
          name: 'Diya Patel',
          dateOfBirth: '2022-09-10',
          guardianName: 'Amit Patel',
          state: 'Gujarat',
          consentStatus: 'granted'
        });

      const childId = registerRes.body.id;

      // Retrieve
      const res = await request(app).get(`/children/${childId}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(childId);
      expect(res.body.name).toBe('Diya Patel');
      expect(res.body.dateOfBirth).toBe('2022-09-10');
      expect(res.body.guardianName).toBe('Amit Patel');
      expect(res.body.state).toBe('Gujarat');
      expect(res.body.consentStatus).toBe('granted');
    });

    test('4. Return 404 for a nonexistent child', async () => {
      const nonexistentId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app).get(`/children/${nonexistentId}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Child not found');
      expect(res.body.message).toContain(nonexistentId);
    });

    test('Return 400 for malformed/invalid child ID', async () => {
      const res = await request(app).get('/children/invalid-not-uuid');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Validation Error');
      expect(res.body.details.some(d => d.includes('UUID'))).toBe(true);
    });
  });

  // 4. Create Vaccination Reminder
  describe('POST /reminders', () => {
    let testChildId;

    beforeEach(async () => {
      const childRes = await request(app)
        .post('/children')
        .send({
          name: 'Rohan Verma',
          dateOfBirth: '2023-01-15',
          guardianName: 'Sanjay Verma',
          state: 'Punjab',
          consentStatus: true
        });
      testChildId = childRes.body.id;
    });

    test('5. Create a reminder successfully', async () => {
      const reminderPayload = {
        childId: testChildId,
        vaccineName: 'Pentavalent 1',
        dueDate: '2026-12-10',
        status: 'scheduled'
      };

      const res = await request(app)
        .post('/reminders')
        .send(reminderPayload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.childId).toBe(testChildId);
      expect(res.body.vaccineName).toBe('Pentavalent 1');
      expect(res.body.dueDate).toBe('2026-12-10');
      expect(res.body.status).toBe('scheduled');
      expect(res.body).toHaveProperty('createdAt');
    });

    test('6. Reject a reminder for a nonexistent child', async () => {
      const nonexistentId = '11111111-2222-3333-4444-555555555555';
      const payload = {
        childId: nonexistentId,
        vaccineName: 'BCG',
        dueDate: '2026-12-10',
        status: 'scheduled'
      };

      const res = await request(app)
        .post('/reminders')
        .send(payload);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Child not found');
      expect(res.body.message).toContain(nonexistentId);
    });

    test('7. Reject an invalid reminder date', async () => {
      const payload = {
        childId: testChildId,
        vaccineName: 'Rotavirus Dose 2',
        dueDate: '2026-02-30', // Invalid calendar date
        status: 'scheduled'
      };

      const res = await request(app)
        .post('/reminders')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Validation Error');
      expect(res.body.details.some(d => d.includes('valid calendar date'))).toBe(true);
    });

    test('Reject reminder with invalid status', async () => {
      const payload = {
        childId: testChildId,
        vaccineName: 'Oral Polio Vaccine',
        dueDate: '2026-11-25',
        status: 'invalid-status-type'
      };

      const res = await request(app)
        .post('/reminders')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.details.some(d => d.includes('status'))).toBe(true);
    });

    test('Reject reminder with empty vaccine name', async () => {
      const payload = {
        childId: testChildId,
        vaccineName: '   ',
        dueDate: '2026-11-25',
        status: 'scheduled'
      };

      const res = await request(app)
        .post('/reminders')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.details.some(d => d.includes('vaccineName'))).toBe(true);
    });
  });

  // 5. Error Handling & Edge Cases
  describe('Global Error Handling', () => {
    test('Gracefully handle malformed JSON syntax', async () => {
      const res = await request(app)
        .post('/children')
        .set('Content-Type', 'application/json')
        .send('{ "name": "Broken JSON", ');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Malformed JSON');
    });

    test('Return 404 for nonexistent route', async () => {
      const res = await request(app).get('/nonexistent-path');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Not Found');
    });
  });
});
