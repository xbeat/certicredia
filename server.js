/**
 * Certicredia - Main Server Entry Point
 * Cybersecurity Psychology Framework Certification Hub
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const i18n = require('i18n');

// Import routes
const webRoutes = require('./routes/web');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const ecommerceRoutes = require('./routes/ecommerce');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { i18nMiddleware } = require('./middleware/i18nMiddleware');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// =======================
// SECURITY MIDDLEWARE
// =======================

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGINS?.split(',')
    : '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later.'
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// =======================
// GENERAL MIDDLEWARE
// =======================

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// =======================
// I18N CONFIGURATION
// =======================

i18n.configure({
  locales: ['it', 'en'],
  defaultLocale: 'it',
  directory: path.join(__dirname, 'locales'),
  cookie: 'language',
  queryParameter: 'lang',
  autoReload: true,
  updateFiles: false,
  syncFiles: false,
  objectNotation: true,
  register: global
});

app.use(i18n.init);
app.use(i18nMiddleware);

// =======================
// STATIC FILES
// =======================

app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: true
}));

// =======================
// VIEW ENGINE (for dynamic pages)
// =======================

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

// =======================
// ROUTES
// =======================

// Web routes (serve HTML pages)
app.use('/', webRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/ecommerce', ecommerceRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// =======================
// ERROR HANDLING
// =======================

app.use(errorHandler);

// =======================
// START SERVER
// =======================

const server = app.listen(PORT, HOST, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║              🔐  CERTICREDIA SERVER STARTED  🔐              ║
║                                                               ║
║   Cybersecurity Psychology Framework Certification Hub       ║
║                                                               ║
║   Environment: ${process.env.NODE_ENV?.toUpperCase() || 'DEVELOPMENT'}                                       ║
║   Server:      http://${HOST}:${PORT}                           ║
║   Status:      ✅ RUNNING                                     ║
║                                                               ║
║   Powered by CPF3.org                                         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;
