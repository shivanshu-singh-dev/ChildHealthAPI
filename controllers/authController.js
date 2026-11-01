const authService = require('../services/authService');
const { validateRegister, validateLogin } = require('../utils/validator');

/**
 * Registers a new guardian and returns a signed JWT
 * POST /auth/register
 */
function register(req, res, next) {
  try {
    const validation = validateRegister(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation Error',
        details: validation.errors
      });
    }

    const result = authService.register(req.body);

    if (result.conflict) {
      return res.status(409).json({
        error: 'Conflict',
        message: result.message
      });
    }

    return res.status(201).json({
      message: 'Guardian registered successfully',
      token: result.token,
      guardian: result.guardian,
      expiresIn: result.expiresIn
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Authenticates guardian by email/username and password, returning a signed JWT
 * POST /auth/login
 */
function login(req, res, next) {
  try {
    const validation = validateLogin(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation Error',
        details: validation.errors
      });
    }

    const emailOrUsername = req.body.email || req.body.username;
    const result = authService.login({
      email: emailOrUsername,
      password: req.body.password
    });

    if (result.invalidCredentials) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: result.message
      });
    }

    return res.status(200).json({
      message: 'Authentication successful',
      token: result.token,
      guardian: result.guardian,
      expiresIn: result.expiresIn
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login
};
