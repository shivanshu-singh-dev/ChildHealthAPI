const reminderService = require('../services/reminderService');
const { validateReminderCreation } = require('../utils/validator');

/**
 * Creates a vaccination reminder
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

    const result = reminderService.createReminder(req.body);

    if (result.notFound) {
      return res.status(404).json({
        error: 'Child not found',
        message: result.message
      });
    }

    return res.status(201).json(result.reminder);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createReminder
};
