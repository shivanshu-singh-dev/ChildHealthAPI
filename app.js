const express = require('express');

// Import routes
const healthRoutes = require('./routes/healthRoutes');
const childRoutes = require('./routes/childRoutes');
const reminderRoutes = require('./routes/reminderRoutes');

// Import centralized error handler
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Parse JSON request bodies
app.use(express.json());

// Root welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Child Health API (WombTo18 - Level 2)',
    version: '2.0.0',
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

// Catch-all handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}. Please check the API documentation.`
  });
});

// Centralized error handling middleware
app.use(errorHandler);

module.exports = app;
