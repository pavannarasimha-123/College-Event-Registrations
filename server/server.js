const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', '*'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

// Primary REST Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);

// Production Static Serving: Serve client/dist if present (for single-service deployment)
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Error Handling Middleware
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start server function
const startServer = async () => {
  try {
    await connectDB();
    const serverInstance = app.listen(PORT, () => {
      console.log(`[Server] College Event Registration API running on port ${PORT}`);
      console.log(`[Server] Base URL: http://localhost:${PORT}`);
    });
    return serverInstance;
  } catch (error) {
    console.error(`[Server] Failed to initialize database: ${error.message}`);
    const serverInstance = app.listen(PORT, () => {
      console.log(`[Server] Started in degraded mode on port ${PORT} (MongoDB connection pending)`);
    });
    return serverInstance;
  }
};

// Only listen automatically when run directly via "node server.js"
if (require.main === module) {
  startServer();
}

module.exports = app;
