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

const defaultLimiter = createRateLimiter();

module.exports = {
  createRateLimiter,
  defaultLimiter
};
