const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');

// POST /reminders - Create a vaccination reminder
router.post('/', reminderController.createReminder);

module.exports = router;
