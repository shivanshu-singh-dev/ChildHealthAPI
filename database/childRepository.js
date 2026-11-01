const { getDatabase } = require('./db');

function mapRowToChild(row) {
  if (!row) return null;

  let consentStatus = row.consent_status;
  if (consentStatus === 'true') {
    consentStatus = true;
  } else if (consentStatus === 'false') {
    consentStatus = false;
  }

  return {
    id: row.id,
    name: row.name,
    dateOfBirth: row.date_of_birth,
    guardianName: row.guardian_name,
    state: row.state,
    consentStatus,
    createdAt: row.created_at
  };
}

function create(child) {
  const db = getDatabase();
  const consentString = typeof child.consentStatus === 'boolean'
    ? (child.consentStatus ? 'true' : 'false')
    : String(child.consentStatus);

  const stmt = db.prepare(`
    INSERT INTO children (id, name, date_of_birth, guardian_name, state, consent_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    child.id,
    child.name,
    child.dateOfBirth,
    child.guardianName,
    child.state,
    consentString,
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
