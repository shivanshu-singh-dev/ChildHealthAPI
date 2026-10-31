const crypto = require('crypto');
const { reminders } = require('../storage/memoryStore');
const childService = require('./childService');

/**
 * Create a vaccination reminder after verifying child exists
 * @param {object} reminderData 
 * @returns {{ notFound?: boolean, success: boolean, reminder?: object, message?: string }}
 */
function createReminder(reminderData) {
  // Check if child exists
  const child = childService.getChildById(reminderData.childId);
  if (!child) {
    return {
      success: false,
      notFound: true,
      message: `Cannot create reminder: Child with ID '${reminderData.childId}' was not found.`
    };
  }

  const newReminder = {
    id: crypto.randomUUID(),
    childId: reminderData.childId,
    vaccineName: reminderData.vaccineName.trim(),
    dueDate: reminderData.dueDate,
    status: reminderData.status.trim(),
    createdAt: new Date().toISOString()
  };

  reminders.set(newReminder.id, newReminder);

  return {
    success: true,
    reminder: newReminder
  };
}

/**
 * Retrieve a reminder by ID
 * @param {string} id 
 * @returns {object|null}
 */
function getReminderById(id) {
  return reminders.get(id) || null;
}

/**
 * Retrieve all reminders for a given child
 * @param {string} childId 
 * @returns {Array<object>}
 */
function getRemindersByChildId(childId) {
  const result = [];
  for (const reminder of reminders.values()) {
    if (reminder.childId === childId) {
      result.push(reminder);
    }
  }
  return result;
}

module.exports = {
  createReminder,
  getReminderById,
  getRemindersByChildId
};
