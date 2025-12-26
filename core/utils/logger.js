/**
 * Simple Logger Utility
 * Provides structured logging with different levels
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL || 'info'];

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

const timestamp = () => {
  return new Date().toISOString();
};

const formatMessage = (level, message, meta = {}) => {
  const ts = timestamp();
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `[${ts}] [${level.toUpperCase()}] ${message}${metaStr}`;
};

const logger = {
  error: (message, error = null) => {
    if (LOG_LEVELS.error <= currentLevel) {
      const meta = error ? { error: error.message, stack: error.stack } : {};
      console.error(`${colors.red}${formatMessage('error', message, meta)}${colors.reset}`);
    }
  },

  warn: (message, meta = {}) => {
    if (LOG_LEVELS.warn <= currentLevel) {
      console.warn(`${colors.yellow}${formatMessage('warn', message, meta)}${colors.reset}`);
    }
  },

  info: (message, meta = {}) => {
    if (LOG_LEVELS.info <= currentLevel) {
      console.info(`${colors.cyan}${formatMessage('info', message, meta)}${colors.reset}`);
    }
  },

  debug: (message, meta = {}) => {
    if (LOG_LEVELS.debug <= currentLevel) {
      console.debug(`${colors.gray}${formatMessage('debug', message, meta)}${colors.reset}`);
    }
  },

  success: (message, meta = {}) => {
    if (LOG_LEVELS.info <= currentLevel) {
      console.log(`${colors.green}${formatMessage('info', message, meta)}${colors.reset}`);
    }
  }
};

export default logger;
