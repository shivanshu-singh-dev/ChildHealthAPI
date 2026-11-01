const { getDatabase } = require('./db');

function mapRowToReminder(row) {
  if (!row) return null;
  return {
    id: row.id,
    childId: row.child_id,
    vaccineName: row.vaccine_name,
    dueDate: row.due_date,
    status: row.status,
    createdAt: row.created_at
  };
}

function create(reminder) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO vaccination_reminders (id, child_id, vaccine_name, due_date, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    reminder.id,
    reminder.childId,
    reminder.vaccineName,
    reminder.dueDate,
    reminder.status,
    reminder.createdAt
  );

  return reminder;
}

function findById(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM vaccination_reminders WHERE id = ?');
  const row = stmt.get(id);
  return mapRowToReminder(row);
}

function findByChildId(childId) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM vaccination_reminders WHERE child_id = ? ORDER BY due_date ASC');
  const rows = stmt.all(childId);
  return rows.map(mapRowToReminder);
}

module.exports = {
  create,
  findById,
  findByChildId
};
