require('dotenv').config();
const http = require('http');
const express = require('express');
const morgan = require('morgan');
const passport = require('./config/passport');
const { initializeWebSocket } = require('./socket');

const corsConfig = require('./config/cors');
const securityHeaders = require('./middleware/security');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const volunteerRoutes = require('./routes/volunteer.routes');
const adminRoutes = require('./routes/admin.routes');
const backgroundCheckRoutes = require('./routes/backgroundCheck.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Core middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(corsConfig);
app.use(securityHeaders);
app.use(apiLimiter);
app.use(requestLogger);
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/background-checks', backgroundCheckRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

const server = http.createServer(app);
initializeWebSocket(server);
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
