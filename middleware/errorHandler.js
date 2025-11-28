/**
 * Error Handling Middleware
 */

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }

  // Database errors
  if (err.code === '23505') { // Unique constraint violation
    statusCode = 409;
    message = 'Resource already exists';
  }

  if (err.code === '23503') { // Foreign key violation
    statusCode = 400;
    message = 'Invalid reference';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message: message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err
      })
    }
  });
};

module.exports = { errorHandler };
