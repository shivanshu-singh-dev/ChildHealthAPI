const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const authenticate = require('../middleware/auth');

// All reminder endpoints require guardian authentication
router.use(authenticate);

// POST /reminders - Create a vaccination reminder
router.post('/', reminderController.createReminder);

module.exports = router;
