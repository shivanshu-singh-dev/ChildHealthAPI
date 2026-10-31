const express = require('express');
const router = express.Router();
const childController = require('../controllers/childController');

// POST /children - Register a child
router.post('/', childController.registerChild);

// GET /children/:id - Retrieve a child's profile
router.get('/:id', childController.getChildById);

module.exports = router;
