import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production-certicredia-2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

/**
 * Generate JWT access token
 * @param {Object} payload - User data to encode
 * @returns {string} JWT token
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'certicredia.org',
    audience: 'certicredia-users'
  });
};

/**
 * Generate JWT refresh token
 * @param {Object} payload - User data to encode
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'certicredia.org',
    audience: 'certicredia-users'
  });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'certicredia.org',
      audience: 'certicredia-users'
    });
  } catch (error) {
    throw new Error('Token non valido o scaduto');
  }
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null
 */
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }

  return null;
};

/**
 * Create user payload for JWT (without sensitive data)
 * @param {Object} user - User object from database
 * @returns {Object} Safe user payload
 */
export const createUserPayload = (user) => {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
};

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  extractTokenFromHeader,
  createUserPayload,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN
};
