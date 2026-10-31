const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

// GET /health - API health check
router.get('/', healthController.getHealth);

module.exports = router;
