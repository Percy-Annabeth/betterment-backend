import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import routes
import leaderboardRoutes from './src/routes/leaderboard.js';
import eventRoutes from './src/routes/events.js';
import transactionRoutes from './src/routes/transactions.js';
import groupRoutes from './src/routes/groups.js';
import userRoutes from './src/routes/users.js';

// Import middleware
import { handleError } from './src/utils/errors.js';

// Import cron jobs
import { startCronJobs } from './src/jobs/cronJobs.js';

// Import logger
import { logger } from './src/utils/logger.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined')); // Request logging

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Betterment API Server',
    version: '1.0.0',
    status: 'Running',
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});



// TEMPORARY DEBUG ENDPOINT - Remove after testing
app.get('/api/debug/firebase-config', (req, res) => {
  res.json({
    project_id: process.env.FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    has_private_key: !!process.env.FIREBASE_PRIVATE_KEY,
    private_key_length: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
    private_key_starts_with: process.env.FIREBASE_PRIVATE_KEY?.substring(0, 27),
    env_vars_present: {
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      FIREBASE_PRIVATE_KEY_ID: !!process.env.FIREBASE_PRIVATE_KEY_ID,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_CLIENT_ID: !!process.env.FIREBASE_CLIENT_ID,
    }
  });
});




// API Routes
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/users', userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handling middleware (must be last)
app.use(handleError);

// Start cron jobs
startCronJobs();

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔥 Firebase Project: ${process.env.FIREBASE_PROJECT_ID}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});