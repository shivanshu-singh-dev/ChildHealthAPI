const crypto = require('crypto');
const reminderRepository = require('../database/reminderRepository');
const childRepository = require('../database/childRepository');

/**
 * Creates a vaccination reminder after verifying the child exists
 * @param {object} reminderData 
 * @returns {{ notFound?: boolean, success: boolean, reminder?: object, message?: string }}
 */
function createReminder(reminderData) {
  const childExists = childRepository.exists(reminderData.childId.trim());
  if (!childExists) {
    return {
      success: false,
      notFound: true,
      message: `Cannot create reminder: Child with ID '${reminderData.childId}' was not found.`
    };
  }

  const newReminder = {
    id: crypto.randomUUID(),
    childId: reminderData.childId.trim(),
    vaccineName: reminderData.vaccineName.trim(),
    dueDate: reminderData.dueDate.trim(),
    status: reminderData.status.trim().toLowerCase(),
    createdAt: new Date().toISOString()
  };

  const created = reminderRepository.create(newReminder);

  return {
    success: true,
    reminder: created
  };
}

/**
 * Retrieves a reminder by ID
 * @param {string} id 
 * @returns {object|null}
 */
function getReminderById(id) {
  return reminderRepository.findById(id);
}

/**
 * Retrieves all reminders for a given child
 * @param {string} childId 
 * @returns {Array<object>}
 */
function getRemindersByChildId(childId) {
  return reminderRepository.findByChildId(childId);
}

module.exports = {
  createReminder,
  getReminderById,
  getRemindersByChildId
};
