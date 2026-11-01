/**
 * Safe Request Logging Middleware
 * 
 * Logs operational HTTP activity while strictly redacting sensitive
 * headers (such as Authorization / Bearer tokens) and request payloads
 * to prevent PII and credentials from entering log streams.
 */
function safeLogger(req, res, next) {
  // Do not log in test runs to keep test outputs clean
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    // Redact query parameters or sensitive URLs if present
    const cleanUrl = req.originalUrl.split('?')[0];

    // Log only method, sanitized route, status, and duration
    console.log(`[${new Date().toISOString()}] ${req.method} ${cleanUrl} - ${res.statusCode} (${duration}ms)`);
  });

  next();
}

module.exports = safeLogger;
