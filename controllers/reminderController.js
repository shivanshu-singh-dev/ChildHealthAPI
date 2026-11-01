const reminderService = require('../services/reminderService');
const { validateReminderCreation } = require('../utils/validator');

/**
 * Creates a vaccination reminder with guardian ownership and consent enforcement
 * POST /reminders
 */
function createReminder(req, res, next) {
  try {
    const validation = validateReminderCreation(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation Error',
        details: validation.errors
      });
    }

    const result = reminderService.createReminder(req.body, req.guardian.id);

    if (result.notFound) {
      return res.status(404).json({
        error: 'Child not found',
        message: result.message
      });
    }

    if (result.forbidden) {
      return res.status(403).json({
        error: 'Forbidden',
        message: result.message
      });
    }

    if (result.consentDenied) {
      return res.status(403).json({
        error: 'Consent Required',
        message: result.message
      });
    }

    // Expose only required reminder fields
    return res.status(201).json({
      id: result.reminder.id,
      childId: result.reminder.childId,
      vaccineName: result.reminder.vaccineName,
      dueDate: result.reminder.dueDate,
      status: result.reminder.status,
      createdAt: result.reminder.createdAt
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createReminder
};
