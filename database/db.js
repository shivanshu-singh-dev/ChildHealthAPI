const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let dbInstance = null;

function initializeSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS children (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      guardian_name TEXT NOT NULL,
      state TEXT NOT NULL,
      consent_status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vaccination_reminders (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL,
      vaccine_name TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
    );

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
  `);
}

module.exports = {
  getDatabase,
  closeDatabase,
  resetDatabase,
  initializeSchema
};
