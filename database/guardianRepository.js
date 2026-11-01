const { getDatabase } = require('./db');

function mapRowToGuardian(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    authToken: row.auth_token,
    createdAt: row.created_at
  };
}

function findByToken(token) {
  if (!token || typeof token !== 'string') return null;
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM guardians WHERE auth_token = ?');
  const row = stmt.get(token.trim());
  return mapRowToGuardian(row);
}

function findById(id) {
  if (!id || typeof id !== 'string') return null;
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM guardians WHERE id = ?');
  const row = stmt.get(id.trim());
  return mapRowToGuardian(row);
}

function create(guardian) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO guardians (id, name, email, auth_token, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(
    guardian.id,
    guardian.name,
    guardian.email,
    guardian.authToken,
    guardian.createdAt
  );

  return guardian;
}

module.exports = {
  findByToken,
  findById,
  create
};
