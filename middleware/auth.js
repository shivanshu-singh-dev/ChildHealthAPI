const guardianRepository = require('../database/guardianRepository');

/**
 * Mock Bearer Authentication Middleware
 * 
 * Validates the Authorization header and attaches the authenticated
 * guardian record to the request.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || typeof authHeader !== 'string') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: "Authorization header is required in the format 'Bearer <token>'"
    });
  }

  const parts = authHeader.trim().split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: "Authorization header must use the Bearer scheme: 'Bearer <token>'"
    });
  }

  const token = parts[1].trim();
  const guardian = guardianRepository.findByToken(token);

  if (!guardian) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired authorization token'
    });
  }

  // Attach authenticated identity to request context
  req.guardian = guardian;
  next();
}

module.exports = authenticate;
