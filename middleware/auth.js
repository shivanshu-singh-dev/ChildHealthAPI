const { verifyToken } = require('../services/authService');
const guardianRepository = require('../database/guardianRepository');

/**
 * JWT Authentication Middleware
 * 
 * Verifies signed Bearer JWTs, enforces algorithm pinning (HS256),
 * issuer/audience validation, validates active guardian existence in DB,
 * and binds identity strictly to req.guardian.id.
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

  try {
    const decoded = verifyToken(token);

    if (!decoded.sub || typeof decoded.sub !== 'string') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token subject claim.'
      });
    }

    // Verify that the guardian account still exists in the database
    const guardian = guardianRepository.findById(decoded.sub);
    if (!guardian) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Account associated with this token no longer exists.'
      });
    }

    // Bind identity exclusively from verified JWT subject claim
    req.guardian = {
      id: guardian.id,
      name: guardian.name,
      email: guardian.email
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authorization token has expired. Please log in again.'
      });
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or tampered authorization token.'
    });
  }
}

module.exports = authenticate;
