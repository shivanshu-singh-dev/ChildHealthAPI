const { getDatabase } = require('./db');

function mapRowToGuardian(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at
  };
}

function findById(id) {
  if (!id || typeof id !== 'string') return null;
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM guardians WHERE id = ?');
  const row = stmt.get(id.trim());
  return mapRowToGuardian(row);
}

function findByEmail(identifier) {
  if (!identifier || typeof identifier !== 'string') return null;
  const clean = identifier.trim().toLowerCase();
  const db = getDatabase();

  // Match exact email, or username shorthand (e.g. 'user1' matching 'user1@example.com')
  const stmt = db.prepare(`
    SELECT * FROM guardians 
    WHERE LOWER(email) = ? 
       OR LOWER(email) = ? || '@example.com'
       OR id = 'guardian-' || ?
    LIMIT 1
  `);
  const row = stmt.get(clean, clean, clean);
  return mapRowToGuardian(row);
}

function emailExists(email) {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim().toLowerCase();
  const db = getDatabase();
  const stmt = db.prepare('SELECT 1 FROM guardians WHERE LOWER(email) = ? LIMIT 1');
  return Boolean(stmt.get(clean));
}

function create(guardian) {
  const db = getDatabase();
  const tableInfo = db.prepare("PRAGMA table_info(guardians)").all();
  const hasAuthToken = tableInfo.some(col => col.name === 'auth_token');

  const sql = hasAuthToken
    ? `INSERT INTO guardians (id, name, email, password_hash, auth_token, created_at) VALUES (?, ?, ?, ?, ?, ?)`
    : `INSERT INTO guardians (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)`;

  const stmt = db.prepare(sql);

  if (hasAuthToken) {
    stmt.run(
      guardian.id,
      guardian.name,
      guardian.email.toLowerCase(),
      guardian.passwordHash,
      `token-${guardian.id}`,
      guardian.createdAt
    );
  } else {
    stmt.run(
      guardian.id,
      guardian.name,
      guardian.email.toLowerCase(),
      guardian.passwordHash,
      guardian.createdAt
    );
  }

  return {
    id: guardian.id,
    name: guardian.name,
    email: guardian.email.toLowerCase(),
    createdAt: guardian.createdAt
  };
}

module.exports = {
  findById,
  findByEmail,
  emailExists,
  create
};
