const rateLimit = require('express-rate-limit');

/**
 * Factory for configurable rate limiting
 * @param {object} options 
 * @returns {Function} Express rate limit middleware
 */
function createRateLimiter(options = {}) {
  const isTest = process.env.NODE_ENV === 'test';
  const defaultMax = isTest ? 500 : (parseInt(process.env.RATE_LIMIT_MAX, 10) || 100);
  const defaultWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || (15 * 60 * 1000);

  return rateLimit({
    windowMs: options.windowMs || defaultWindowMs,
    max: options.max !== undefined ? options.max : defaultMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.'
    },
    ...options
  });
}

// Global API rate limiter
const defaultLimiter = createRateLimiter();

// Strict limiter for authentication endpoints (login & register)
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 100 : (parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 15),
  message: {
    error: 'Too Many Requests',
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  }
});

module.exports = {
  createRateLimiter,
  defaultLimiter,
  authLimiter
};
