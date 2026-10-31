/**
 * Health check controller
 * GET /health
 */
function getHealth(req, res) {
  return res.status(200).json({
    status: 'UP',
    service: 'Child Health API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  getHealth
};
