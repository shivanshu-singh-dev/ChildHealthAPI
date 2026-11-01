const app = require('./app');
const { getDatabase, closeDatabase } = require('./database/db');

const PORT = process.env.PORT || 3000;

// Initialize SQLite database and tables
try {
  getDatabase();
  console.log('Database initialized successfully.');
} catch (err) {
  console.error('Failed to initialize database:', err);
  process.exit(1);
}

const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Child Health API (Level 2) is running!`);
  console.log(` Listening on: http://localhost:${PORT}`);
  console.log(` Health check:  http://localhost:${PORT}/health`);
  console.log(` Storage:       SQLite persistent storage`);
  console.log(`===============================================`);
});

// Graceful shutdown handling
function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}. Gracefully shutting down...`);
  server.close(() => {
    closeDatabase();
    console.log('Server and database closed. Exiting process.');
    process.exit(0);
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = server;
