const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let dbInstance = null;

// Pre-computed bcrypt hashes (cost factor: 10) for test credentials
const TEST_USERS = [
  {
    id: 'guardian-user1',
    name: 'User One',
    email: 'user1@example.com',
    passwordHash: '$2b$10$KZmSJGKP1IrAWiO0ZhHTVOKcWsUL5rc.05jb8EiadStS7wwo7P7Mm', // password: user1
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'guardian-user2',
    name: 'User Two',
    email: 'user2@example.com',
    passwordHash: '$2b$10$ImxM.f8aYONchsESM5r/M.habO48X5DbLkalNMA6uwDx7WS1chU9G', // password: user2
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'guardian-user3',
    name: 'User Three',
    email: 'user3@example.com',
    passwordHash: '$2b$10$lNNLOjy7u0QIsA6ieUxiZOr6knrieHXL3aI/.QaELB.y.BaRcvLua', // password: user3
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

function seedDefaultGuardians(db) {
  const tableInfo = db.prepare("PRAGMA table_info(guardians)").all();
  const hasAuthToken = tableInfo.some(col => col.name === 'auth_token');

  const sql = hasAuthToken
    ? `INSERT INTO guardians (id, name, email, password_hash, auth_token, created_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         email = excluded.email,
         password_hash = excluded.password_hash,
         auth_token = excluded.auth_token`
    : `INSERT INTO guardians (id, name, email, password_hash, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         email = excluded.email,
         password_hash = excluded.password_hash`;

  const stmt = db.prepare(sql);

  for (const user of TEST_USERS) {
    if (hasAuthToken) {
      stmt.run(user.id, user.name, user.email, user.passwordHash, `token-${user.id}`, user.createdAt);
    } else {
      stmt.run(user.id, user.name, user.email, user.passwordHash, user.createdAt);
    }
  }
}

function initializeSchema(db) {
  // 1. Create guardians table
  db.exec(`
    CREATE TABLE IF NOT EXISTS guardians (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Migrate existing guardians table if password_hash is absent
  const guardianTableInfo = db.prepare("PRAGMA table_info(guardians)").all();
  const hasPasswordHash = guardianTableInfo.some(col => col.name === 'password_hash');
  if (!hasPasswordHash && guardianTableInfo.length > 0) {
    db.exec(`
      ALTER TABLE guardians ADD COLUMN password_hash TEXT;
    `);
  }

  // Seed default test guardians
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
      UPDATE children SET guardian_id = 'guardian-user1' WHERE guardian_id IS NULL;
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

    CREATE INDEX IF NOT EXISTS idx_guardians_email ON guardians(email);
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
