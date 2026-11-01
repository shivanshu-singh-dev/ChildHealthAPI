const { getDatabase } = require('./db');

function mapRowToChild(row) {
  if (!row) return null;

  return {
    id: row.id,
    guardianId: row.guardian_id,
    name: row.name,
    dateOfBirth: row.date_of_birth,
    guardianName: row.guardian_name,
    state: row.state,
    consentStatus: row.consent_status,
    createdAt: row.created_at
  };
}

function create(child) {
  const db = getDatabase();

  const stmt = db.prepare(`
    INSERT INTO children (id, guardian_id, name, date_of_birth, guardian_name, state, consent_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    child.id,
    child.guardianId,
    child.name,
    child.dateOfBirth,
    child.guardianName,
    child.state,
    child.consentStatus,
    child.createdAt
  );

  return child;
}

function findById(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM children WHERE id = ?');
  const row = stmt.get(id);
  return mapRowToChild(row);
}

function exists(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT 1 FROM children WHERE id = ?');
  return Boolean(stmt.get(id));
}

module.exports = {
  create,
  findById,
  exists
};
