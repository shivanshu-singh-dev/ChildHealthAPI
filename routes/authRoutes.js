const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');

// Rate-limited authentication endpoints
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);

module.exports = router;
