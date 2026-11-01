const childService = require('../services/childService');
const { validateChildRegistration, validateIdParam } = require('../utils/validator');

/**
 * Registers a new child profile
 * POST /children
 */
function registerChild(req, res, next) {
  try {
    const validation = validateChildRegistration(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation Error',
        details: validation.errors
      });
    }

    const createdChild = childService.registerChild(req.body);
    return res.status(201).json(createdChild);
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves a child profile by ID
 * GET /children/:id
 */
function getChildById(req, res, next) {
  try {
    const { id } = req.params;

    const idValidation = validateIdParam(id);
    if (!idValidation.isValid) {
      return res.status(400).json({
        error: 'Validation Error',
        details: [idValidation.error]
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
  } catch (err) {
    next(err);
  }
}

module.exports = {
  registerChild,
  getChildById
};
