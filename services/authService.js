const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const guardianRepository = require('../database/guardianRepository');

const JWT_SECRET = process.env.JWT_SECRET || 'child-health-api-jwt-secret-key-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_ISSUER = 'child-health-api';
const JWT_AUDIENCE = 'child-health-api';

// Pre-computed dummy hash to prevent timing-based email enumeration
const DUMMY_HASH = '$2b$10$KZmSJGKP1IrAWiO0ZhHTVOKcWsUL5rc.05jb8EiadStS7wwo7P7Mm';

/**
 * Generates a signed JWT with minimal payload
 * @param {string} guardianId 
 * @returns {string} signed JWT
 */
function generateToken(guardianId) {
  const payload = {
    sub: guardianId,
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE
  };

  return jwt.sign(payload, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: JWT_EXPIRES_IN
  });
}

/**
 * Cryptographically verifies token signature, expiration, issuer, and audience
 * @param {string} token 
 * @returns {object} decoded token payload
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET, {
    algorithms: ['HS256'],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE
  });
}

/**
 * Registers a new guardian with bcrypt hashed password
 * @param {object} param0 
 * @returns {object}
 */
function register({ name, email, password }) {
  const cleanEmail = email.trim().toLowerCase();

  // Check for email collision
  if (guardianRepository.emailExists(cleanEmail)) {
    return {
      conflict: true,
      message: `An account with email '${cleanEmail}' already exists.`
    };
  }

  // Hash password using bcrypt (work factor 10)
  const passwordHash = bcrypt.hashSync(password, 10);

  const newGuardian = guardianRepository.create({
    id: crypto.randomUUID(),
    name: name.trim(),
    email: cleanEmail,
    passwordHash,
    createdAt: new Date().toISOString()
  });

  const token = generateToken(newGuardian.id);

  return {
    success: true,
    token,
    guardian: {
      id: newGuardian.id,
      name: newGuardian.name,
      email: newGuardian.email
    },
    expiresIn: JWT_EXPIRES_IN
  };
}

/**
 * Authenticates guardian by email/identifier and password
 * @param {object} param0 
 * @returns {object}
 */
function login({ email, password }) {
  const identifier = email ? email.trim() : '';
  const guardian = guardianRepository.findByEmail(identifier);

  if (!guardian) {
    // Perform dummy bcrypt comparison to neutralize timing attacks
    bcrypt.compareSync(password, DUMMY_HASH);
    return {
      invalidCredentials: true,
      message: 'Invalid email or password.'
    };
  }

  const isMatch = bcrypt.compareSync(password, guardian.passwordHash);
  if (!isMatch) {
    return {
      invalidCredentials: true,
      message: 'Invalid email or password.'
    };
  }

  const token = generateToken(guardian.id);

  return {
    success: true,
    token,
    guardian: {
      id: guardian.id,
      name: guardian.name,
      email: guardian.email
    },
    expiresIn: JWT_EXPIRES_IN
  };
}

module.exports = {
  generateToken,
  verifyToken,
  register,
  login,
  JWT_EXPIRES_IN
};
