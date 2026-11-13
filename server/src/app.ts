import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { config } from './config/env.js';
import { authRoutes } from './features/auth/auth.routes.js';
import { travelRoutes } from './features/travel/travel.routes.js';
import { usersRoutes } from './features/users/users.routes.js';
import { pool } from './shared/db/pool.js';
import { errorHandler } from './shared/middleware/error.middleware.js';

export const app = express();

// Middlewares
app.use(
  cors({
    origin: config.clientUrl || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// Base Route
app.get('/', (_req, res) => {
  res.status(200).json({
    message: 'TripFlow API is running',
    version: '1.0.0',
  });
});

// Health check endpoint
app.get('/api/health', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: result.rows[0].now,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      message: (error as Error).message,
    });
  }
});

// Feature Routes
app.use('/api/auth', authRoutes);
app.use('/api/travel', travelRoutes);
app.use('/api/users', usersRoutes);

// Centralized error handler
app.use(errorHandler);
