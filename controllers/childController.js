const childService = require('../services/childService');
const { validateChildRegistration } = require('../utils/validator');

/**
 * Register a child
 * POST /children
 */
function registerChild(req, res) {
  const validation = validateChildRegistration(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      error: 'Validation Error',
      details: validation.errors
    });
  }

  const newChild = childService.registerChild(req.body);
  return res.status(201).json(newChild);
}

/**
 * Retrieve a child's profile
 * GET /children/:id
 */
function getChildById(req, res) {
  const { id } = req.params;

  if (!id || id.trim().length === 0) {
    return res.status(400).json({
      error: 'Validation Error',
      details: ["Child ID parameter is required"]
    });
  }

  const child = childService.getChildById(id.trim());
  if (!child) {
    return res.status(404).json({
      error: 'Child not found',
      message: `No child found with ID '${id}'`
    });
  }

  return res.status(200).json(child);
}

module.exports = {
  registerChild,
  getChildById
};
