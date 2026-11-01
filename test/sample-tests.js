const http = require('http');
const app = require('../app');
const { resetDatabase } = require('../database/db');

let server;
let baseUrl;

async function runTests() {
  process.env.NODE_ENV = 'test';
  console.log('\n🚀 Starting Child Health API Automated Test Suite (Level 1 & 2)\n');

  // Start app on random available port
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`Test server running at ${baseUrl}\n`);
      resolve();
    });
  });

  let passed = 0;
  let failed = 0;

  async function assertTest(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  try {
    resetDatabase();

    // 1. Health check
    await assertTest('GET /health returns 200 and UP status', async () => {
      const res = await fetch(`${baseUrl}/health`);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const data = await res.json();
      if (data.status !== 'UP') throw new Error(`Expected status UP, got ${data.status}`);
      if (!data.service) throw new Error('Missing service field');
    });

    // 2. Child registration - Valid
    let registeredChildId;
    await assertTest('POST /children successfully registers a child (201 Created)', async () => {
      const payload = {
        name: 'Aarav Sharma',
        dateOfBirth: '2023-04-12',
        guardianName: 'Priya Sharma',
        state: 'Maharashtra',
        consentStatus: true
      };

      const res = await fetch(`${baseUrl}/children`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
      const data = await res.json();

      if (!data.id) throw new Error('Child ID was not generated');
      if (data.name !== 'Aarav Sharma') throw new Error(`Name mismatch: ${data.name}`);
      if (data.dateOfBirth !== '2023-04-12') throw new Error('dateOfBirth mismatch');
      if (data.guardianName !== 'Priya Sharma') throw new Error('guardianName mismatch');
      if (data.state !== 'Maharashtra') throw new Error('state mismatch');
      if (data.consentStatus !== true) throw new Error('consentStatus mismatch');
      if (!data.createdAt) throw new Error('createdAt timestamp missing');

      registeredChildId = data.id;
    });

    // 3. Retrieve registered child
    await assertTest('GET /children/:id retrieves existing child profile (200 OK)', async () => {
      const res = await fetch(`${baseUrl}/children/${registeredChildId}`);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const data = await res.json();
      if (data.id !== registeredChildId) throw new Error('Retrieved wrong child ID');
      if (data.name !== 'Aarav Sharma') throw new Error('Retrieved child profile incorrect');
    });

    // 4. Retrieve non-existent child
    await assertTest('GET /children/:id returns 404 for non-existent child', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await fetch(`${baseUrl}/children/${fakeId}`);
      if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
      const data = await res.json();
      if (!data.error) throw new Error('Expected error message in response');
    });

    // 5. Validation: Missing mandatory fields in child registration
    await assertTest('POST /children returns 400 when required fields are missing', async () => {
      const incompletePayload = {
        name: 'Incomplete Child'
        // Missing dateOfBirth, guardianName, state, consentStatus
      };

      const res = await fetch(`${baseUrl}/children`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incompletePayload)
      });

      if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
      const data = await res.json();
      if (!data.details || data.details.length < 4) {
        throw new Error(`Expected validation error details for all missing fields, got: ${JSON.stringify(data.details)}`);
      }
    });

    // 6. Validation: Invalid date format for dateOfBirth
    await assertTest('POST /children returns 400 for invalid date format', async () => {
      const invalidDatePayload = {
        name: 'Test Baby',
        dateOfBirth: '12-04-2023', // DD-MM-YYYY instead of YYYY-MM-DD
        guardianName: 'Test Parent',
        state: 'Delhi',
        consentStatus: 'granted'
      };

      const res = await fetch(`${baseUrl}/children`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidDatePayload)
      });

      if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    });

    // 7. Validation: Future date of birth
    await assertTest('POST /children returns 400 for future date of birth', async () => {
      const futureDatePayload = {
        name: 'Future Baby',
        dateOfBirth: '2099-01-01',
        guardianName: 'Test Parent',
        state: 'Delhi',
        consentStatus: true
      };

      const res = await fetch(`${baseUrl}/children`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(futureDatePayload)
      });

      if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    });

    // 8. Create reminder for existing child - Valid
    let reminderId;
    await assertTest('POST /reminders successfully creates reminder for existing child (201 Created)', async () => {
      const reminderPayload = {
        childId: registeredChildId,
        vaccineName: 'Polio (OPV - Booster)',
        dueDate: '2026-12-15',
        status: 'scheduled'
      };

      const res = await fetch(`${baseUrl}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reminderPayload)
      });

      if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
      const data = await res.json();

      if (!data.id) throw new Error('Reminder ID not generated');
      if (data.childId !== registeredChildId) throw new Error('childId mismatch');
      if (data.vaccineName !== 'Polio (OPV - Booster)') throw new Error('vaccineName mismatch');
      if (data.dueDate !== '2026-12-15') throw new Error('dueDate mismatch');
      if (data.status !== 'scheduled') throw new Error('status mismatch');
      if (!data.createdAt) throw new Error('createdAt timestamp missing');

      reminderId = data.id;
    });

    // 9. Create reminder for non-existent child (Verify child existence check)
    await assertTest('POST /reminders returns 404 when childId does not exist', async () => {
      const fakeReminderPayload = {
        childId: '00000000-0000-0000-0000-000000000000',
        vaccineName: 'BCG',
        dueDate: '2026-11-20',
        status: 'scheduled'
      };

      const res = await fetch(`${baseUrl}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fakeReminderPayload)
      });

      if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
      const data = await res.json();
      if (!data.error || !data.message.includes('not found')) {
        throw new Error(`Unexpected error body: ${JSON.stringify(data)}`);
      }
    });

    // 10. Validation: Missing fields in reminder payload
    await assertTest('POST /reminders returns 400 when fields are missing', async () => {
      const invalidReminderPayload = {
        childId: registeredChildId
        // Missing vaccineName, dueDate, status
      };

      const res = await fetch(`${baseUrl}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidReminderPayload)
      });

      if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    });

    // 11. Validation: Invalid date format in reminder
    await assertTest('POST /reminders returns 400 when dueDate has invalid format', async () => {
      const invalidDateReminder = {
        childId: registeredChildId,
        vaccineName: 'Measles',
        dueDate: '2026/12/31', // Slash format instead of hyphen
        status: 'scheduled'
      };

      const res = await fetch(`${baseUrl}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidDateReminder)
      });

      if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    });

    // 12. Malformed JSON request body
    await assertTest('Malformed JSON request body returns 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/children`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ "name": "Broken JSON", ' // Intentional syntax error
      });

      if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
      const data = await res.json();
      if (data.error !== 'Malformed JSON') throw new Error(`Unexpected error: ${data.error}`);
    });

    // 13. Undefined route handling
    await assertTest('Nonexistent routes return 404 Not Found JSON', async () => {
      const res = await fetch(`${baseUrl}/unknown-route`);
      if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
      const data = await res.json();
      if (data.error !== 'Not Found') throw new Error(`Expected Not Found, got ${data.error}`);
    });

  } finally {
    server.close();
  }

  console.log(`\n===============================================`);
  console.log(`Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`===============================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
