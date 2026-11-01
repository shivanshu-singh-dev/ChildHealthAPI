/**
 * Centralized Error Handling Middleware
 * 
 * Formats all operational, validation, database, and unexpected errors
 * into a consistent JSON response structure without leaking stack traces.
 */

function errorHandler(err, req, res, next) {
  // 1. Handle payload size limit exceeded (413)
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({
      error: 'Payload Too Large',
      message: 'Request payload exceeds the maximum allowed size limit (10kb).'
    });
  }

  // 2. Handle JSON parsing syntax errors (body-parser)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Malformed JSON',
      message: 'The request body contains invalid JSON syntax.'
    });
  }

  // 3. Handle known operational Application Errors (AppError)
  if (err.isOperational) {
    const response = {
      error: err.message
    };
    if (err.details) {
      response.details = err.details;
    }
    return res.status(err.statusCode || 400).json(response);
  }

  // 4. Handle SQLite Database Errors
  if (err.code && typeof err.code === 'string' && err.code.startsWith('SQLITE_')) {
    if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      return res.status(404).json({
        error: 'Resource not found',
        message: 'The referenced entity does not exist in the database.'
      });
    }

    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A record with this identifier already exists.'
      });
    }

    // Generic SQLite error - mask internal schema details
    return res.status(500).json({
      error: 'Database Error',
      message: 'A database error occurred while processing your request.'
    });
  }

  // 5. Handle unexpected/internal errors
  console.error('[Unhandled Server Error]', err);

  return res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred on the server.'
  });
}

module.exports = errorHandler;
