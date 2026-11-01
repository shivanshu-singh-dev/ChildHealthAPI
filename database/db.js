const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let dbInstance = null;

function seedDefaultGuardians(db) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO guardians (id, name, email, auth_token, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(
    'guardian-101',
    'Priya Sharma',
    'priya.sharma@example.com',
    'mock-token-priya',
    '2026-01-01T00:00:00.000Z'
  );

  stmt.run(
    'guardian-102',
    'Rohit Sen',
    'rohit.sen@example.com',
    'mock-token-rohit',
    '2026-01-01T00:00:00.000Z'
  );
}

function initializeSchema(db) {
  // 1. Create guardians table
  db.exec(`
    CREATE TABLE IF NOT EXISTS guardians (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      auth_token TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Seed default mock guardians first
  seedDefaultGuardians(db);

  // 2. Create children table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS children (
      id TEXT PRIMARY KEY,
      guardian_id TEXT NOT NULL,
      name TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      guardian_name TEXT NOT NULL,
      state TEXT NOT NULL,
      consent_status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (guardian_id) REFERENCES guardians(id) ON DELETE CASCADE
    );
  `);

  // Migrate existing children table if guardian_id column is absent
  const tableInfo = db.prepare("PRAGMA table_info(children)").all();
  const hasGuardianId = tableInfo.some(col => col.name === 'guardian_id');
  if (!hasGuardianId && tableInfo.length > 0) {
    db.exec(`
      ALTER TABLE children ADD COLUMN guardian_id TEXT REFERENCES guardians(id) ON DELETE CASCADE;
      UPDATE children SET guardian_id = 'guardian-101' WHERE guardian_id IS NULL;
    `);
  }

  // 3. Create reminders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS vaccination_reminders (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL,
      vaccine_name TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_guardians_auth_token ON guardians(auth_token);
    CREATE INDEX IF NOT EXISTS idx_children_guardian_id ON children(guardian_id);
    CREATE INDEX IF NOT EXISTS idx_reminders_child_id ON vaccination_reminders(child_id);
  `);
}

function getDatabase(customPath) {
  if (dbInstance && !customPath) {
    return dbInstance;
  }

  const isTest = process.env.NODE_ENV === 'test';
  const defaultPath = isTest ? ':memory:' : path.join(__dirname, '../data/child_health.db');
  const dbPath = customPath || process.env.DB_PATH || defaultPath;

  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');

  if (dbPath !== ':memory:') {
    db.pragma('journal_mode = WAL');
  }

  initializeSchema(db);

  if (!customPath) {
    dbInstance = db;
  }

  return db;
}

function closeDatabase() {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // Ignore if already closed
    }
    dbInstance = null;
  }
}

function resetDatabase() {
  const db = getDatabase();
  db.exec(`
    DELETE FROM vaccination_reminders;
    DELETE FROM children;
    DELETE FROM guardians;
  `);
  seedDefaultGuardians(db);
}

module.exports = {
  getDatabase,
  closeDatabase,
  resetDatabase,
  initializeSchema
};
