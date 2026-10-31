const app = require('./app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Child Health API (Level 1) is running!`);
  console.log(` Listening on: http://localhost:${PORT}`);
  console.log(` Health check:  http://localhost:${PORT}/health`);
  console.log(`===============================================`);
});

module.exports = server;
