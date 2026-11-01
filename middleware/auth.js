const { verifyToken } = require('../services/authService');

/**
 * JWT Authentication Middleware
 * 
 * Verifies signed Bearer JWTs, enforces algorithm pinning (HS256),
 * issuer/audience validation, and binds decoded.sub to req.guardian.id.
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

    // Bind identity exclusively from verified JWT subject claim
    req.guardian = {
      id: decoded.sub
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
