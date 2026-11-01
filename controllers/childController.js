const childService = require('../services/childService');
const { validateChildRegistration, validateIdParam } = require('../utils/validator');

/**
 * Registers a new child profile associated with the authenticated guardian
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

    const createdChild = childService.registerChild(req.body, req.guardian.id);
    return res.status(201).json(createdChild);
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves a child profile by ID with ownership enforcement
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

    // Ownership check: Enforce that only the guardian who registered the child can view
    if (child.guardianId !== req.guardian.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: "Access denied: You do not have permission to view this child's profile."
      });
    }

    // Return sanitized data exposing only required information
    return res.status(200).json({
      id: child.id,
      name: child.name,
      dateOfBirth: child.dateOfBirth,
      guardianName: child.guardianName,
      state: child.state,
      consentStatus: child.consentStatus,
      createdAt: child.createdAt
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  registerChild,
  getChildById
};
