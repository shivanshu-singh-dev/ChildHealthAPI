const { getDatabase } = require('../database/db');

/**
 * Health check controller
 * GET /health
 */
function getHealth(req, res, next) {
  try {
    const db = getDatabase();
    db.prepare('SELECT 1').get();

    return res.status(200).json({
      status: 'UP',
      service: 'Child Health API',
      database: 'connected',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getHealth
};
