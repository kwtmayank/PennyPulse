const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');
const { ApiError } = require('./utils/errors');

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (env.allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    ok: true,
    service: 'finance-api',
    version: process.env.RENDER_GIT_COMMIT || 'dev',
    timestamp: new Date().toISOString(),
    uptimeSec: Math.floor(process.uptime())
  });
});

app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

app.use((_req, _res, next) => {
  next(new ApiError(404, 'Route not found'));
});

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({ message });
});

module.exports = app;
