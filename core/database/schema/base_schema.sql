-- ============================================================================
-- CERTICREDIA ITALIA - BASE DATABASE SCHEMA
-- Core tables for ecommerce and admin functionality
-- Version: 1.0
-- ============================================================================

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  phone VARCHAR(50),
  role VARCHAR(50) DEFAULT 'user',
  active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

-- ============================================================================
-- 2. PRODUCTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  short_description TEXT,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100),
  duration_months INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- ============================================================================
-- 3. ORDERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  order_number VARCHAR(50) NOT NULL UNIQUE,

  -- Billing info
  billing_name VARCHAR(255) NOT NULL,
  billing_email VARCHAR(255) NOT NULL,
  billing_phone VARCHAR(50),
  billing_address TEXT NOT NULL,
  billing_city VARCHAR(100) NOT NULL,
  billing_postal_code VARCHAR(20) NOT NULL,
  billing_country VARCHAR(100) DEFAULT 'Italia',
  billing_vat VARCHAR(50),

  -- Totals
  subtotal_amount DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,

  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'completed', 'cancelled')),
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method VARCHAR(50),

  -- Payment integration
  stripe_payment_intent_id VARCHAR(255),
  stripe_session_id VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP,
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,

  -- Notes
  customer_notes TEXT,
  admin_notes TEXT,

  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- ============================================================================
-- 4. ORDER ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,

  -- Product snapshot (in case product is deleted/changed)
  product_name VARCHAR(255) NOT NULL,
  product_slug VARCHAR(255),
  unit_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(10, 2) NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- ============================================================================
-- 5. CART ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(session_id, product_id),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_session_id ON cart_items(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- ============================================================================
-- 6. CONTACTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  linkedin VARCHAR(500),
  user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('COMPANY', 'SPECIALIST')),
  message TEXT,
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_user_type ON contacts(user_type);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);

