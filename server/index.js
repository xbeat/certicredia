import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import contactRoutes from './routes/contact.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import { pool } from './config/database.js';
import logger from './utils/logger.js';

// Accreditation modules routes
import mfaRoutes from '../modules/auth/routes/mfaRoutes.js';
import passwordRoutes from '../modules/auth/routes/passwordRoutes.js';
import organizationRoutes from '../modules/organizations/routes/organizationRoutes.js';
import specialistRoutes from '../modules/specialists/routes/specialistRoutes.js';
import assessmentRoutes from '../modules/assessments/routes/assessmentRoutes.js';
import evidenceRoutes from '../modules/evidence/routes/evidenceRoutes.js';
import workflowRoutes from '../modules/workflow/routes/workflowRoutes.js';
import reportRoutes from '../modules/reports/routes/reportRoutes.js';
import auditingRoutes from '../modules/auditing/routes/auditingRoutes.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// --- AGGIUNTA FONDAMENTALE PER RENDER ---
app.set('trust proxy', 1); 
// ----------------------------------------

const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development - configure properly for production
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// Cookie parser
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Troppi tentativi, riprova più tardi.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, '..')));

// API Routes - Ecommerce
app.use('/api/contact', contactRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// API Routes - Accreditation Modules
app.use('/api/auth/mfa', mfaRoutes);
app.use('/api/auth', passwordRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/specialists', specialistRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/auditing', auditingRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      message: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Root endpoint - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

//Shop endpoint - serve index.html
app.get('/shop', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'shop.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint non trovato' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Server error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Si è verificato un errore interno'
      : err.message
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server CertiCredia avviato su porta ${PORT}`);
  logger.info(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌐 URL: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM ricevuto. Chiusura server...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT ricevuto. Chiusura server...');
  await pool.end();
  process.exit(0);
});

export default app;
