require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

// Import middleware
const { defaultLimiter } = require('./middleware/rateLimiter');
const safeLogger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const childRoutes = require('./routes/childRoutes');
const reminderRoutes = require('./routes/reminderRoutes');

const app = express();

// 1. Security Headers (Helmet)
app.use(helmet());

// 2. Cross-Origin Resource Sharing (CORS)
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Global Rate Limiting
app.use(defaultLimiter);

// 4. Safe Request Logging (Redacting PII and Authorization headers)
app.use(safeLogger);

// 5. Restrict request body size to 10kb
app.use(express.json({ limit: '10kb' }));

// Root welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Child Health API',
    version: '2.0.0',
    endpoints: {
      health: 'GET /health (Public)',
      register: 'POST /auth/register (Public)',
      login: 'POST /auth/login (Public)',
      registerChild: 'POST /children (Requires Bearer JWT)',
      getChild: 'GET /children/:id (Requires Bearer JWT)',
      createReminder: 'POST /reminders (Requires Bearer JWT)'
    }
  });
});

// Mount modular routes
app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
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
