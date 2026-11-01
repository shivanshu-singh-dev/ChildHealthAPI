const crypto = require('crypto');
const reminderRepository = require('../database/reminderRepository');
const childRepository = require('../database/childRepository');

/**
 * Creates a vaccination reminder after verifying existence, ownership, and active consent
 * @param {object} reminderData 
 * @param {string} guardianId 
 * @returns {{ notFound?: boolean, forbidden?: boolean, consentDenied?: boolean, success: boolean, reminder?: object, message?: string }}
 */
function createReminder(reminderData, guardianId) {
  const child = childRepository.findById(reminderData.childId.trim());

  // 1. Verify child existence
  if (!child) {
    return {
      success: false,
      notFound: true,
      message: `Cannot create reminder: Child with ID '${reminderData.childId}' was not found.`
    };
  }

  // 2. Enforce guardian ownership
  if (child.guardianId !== guardianId) {
    return {
      success: false,
      forbidden: true,
      message: 'Access denied: You cannot create reminders for a child you do not manage.'
    };
  }

  // 3. Enforce active consent
  if (child.consentStatus !== 'granted') {
    return {
      success: false,
      consentDenied: true,
      message: `Cannot create reminder: Active granted consent is required. Current consent status is '${child.consentStatus}'.`
    };
  }

  // 4. Create and persist reminder
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
