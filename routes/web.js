/**
 * Web Routes
 * Serves HTML pages
 */

const express = require('express');
const path = require('path');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');

// Apply optional auth to all web routes (for personalized content)
router.use(optionalAuth);

// Homepage
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/index.html'));
});

// Aziende (For Companies)
router.get('/aziende', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/aziende.html'));
});

// Academy (For Assessors)
router.get('/academy', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/academy.html'));
});

// About / Chi Siamo
router.get('/chi-siamo', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/chi-siamo.html'));
});

// Framework / Il Framework
router.get('/framework', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/framework.html'));
});

// Login Page
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/login.html'));
});

// Register Page
router.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/register.html'));
});

// Ecommerce - Products Catalog
router.get('/prodotti', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/prodotti.html'));
});

// Ecommerce - Cart
router.get('/carrello', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/carrello.html'));
});

// Ecommerce - Checkout
router.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/checkout.html'));
});

// User Dashboard (Protected - but check client-side)
router.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/dashboard.html'));
});

module.exports = router;
