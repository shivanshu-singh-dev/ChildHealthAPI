const express = require('express');

// Import routes
const healthRoutes = require('./routes/healthRoutes');
const childRoutes = require('./routes/childRoutes');
const reminderRoutes = require('./routes/reminderRoutes');

const app = express();

// Parse JSON request bodies
app.use(express.json());

// Handle malformed JSON bodies gracefully
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Malformed JSON',
      message: 'The request body is not valid JSON.'
    });
  }
  next(err);
});

// Root welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Child Health API (WombTo18 - Level 1)',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      registerChild: 'POST /children',
      getChild: 'GET /children/:id',
      createReminder: 'POST /reminders'
    }
  });
});

// Mount modular routes
app.use('/health', healthRoutes);
app.use('/children', childRoutes);
app.use('/reminders', reminderRoutes);

// Handle undefined routes (404 Not Found)
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}. Please check the API documentation.`
  });
});

// Global internal server error handler (500)
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred on the server.'
  });
});

module.exports = app;
