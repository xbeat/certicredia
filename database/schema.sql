-- ============================================
-- CERTICREDIA DATABASE SCHEMA
-- Cybersecurity Psychology Framework Hub
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'customer', -- customer, assessor, admin
    company VARCHAR(255),
    job_title VARCHAR(100),
    phone VARCHAR(50),
    language VARCHAR(5) DEFAULT 'it', -- it, en
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Index for faster email lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- ASSESSOR PROFILES
-- ============================================

CREATE TABLE assessors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    certification_number VARCHAR(50) UNIQUE NOT NULL,
    certification_date DATE NOT NULL,
    certification_expiry DATE NOT NULL,
    specializations TEXT[], -- Array of specializations
    bio TEXT,
    linkedin_url VARCHAR(255),
    website_url VARCHAR(255),
    is_certified BOOLEAN DEFAULT TRUE,
    assessments_completed INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assessors_user_id ON assessors(user_id);
CREATE INDEX idx_assessors_certification ON assessors(certification_number);

-- ============================================
-- PRODUCTS & ECOMMERCE
-- ============================================

CREATE TYPE product_type AS ENUM ('certification', 'course', 'book', 'assessment');
CREATE TYPE product_status AS ENUM ('active', 'draft', 'discontinued');

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    type product_type NOT NULL,
    name_it VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    description_it TEXT,
    description_en TEXT,
    short_description_it TEXT,
    short_description_en TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    vat_rate DECIMAL(5,2) DEFAULT 22.00, -- Italian VAT
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    stock_quantity INTEGER DEFAULT 0, -- -1 for unlimited (digital products)
    is_digital BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    status product_status DEFAULT 'active',
    metadata JSONB, -- Additional product-specific data
    image_url VARCHAR(500),
    gallery_urls TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_sku ON products(sku);

-- ============================================
-- ORDERS
-- ============================================

CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled', 'refunded');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    status order_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'pending',
    subtotal DECIMAL(10,2) NOT NULL,
    vat_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    billing_email VARCHAR(255) NOT NULL,
    billing_first_name VARCHAR(100) NOT NULL,
    billing_last_name VARCHAR(100) NOT NULL,
    billing_company VARCHAR(255),
    billing_vat_number VARCHAR(50),
    billing_address TEXT,
    billing_city VARCHAR(100),
    billing_postal_code VARCHAR(20),
    billing_country VARCHAR(2), -- ISO country code
    payment_method VARCHAR(50), -- stripe, paypal, bank_transfer
    payment_transaction_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);

-- ============================================
-- ORDER ITEMS
-- ============================================

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL, -- Snapshot at time of purchase
    product_sku VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    vat_rate DECIMAL(5,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- ============================================
-- ASSESSMENTS (CPF Framework)
-- ============================================

CREATE TYPE assessment_type AS ENUM ('self', 'guided'); -- self-assessment or guided by assessor
CREATE TYPE assessment_status AS ENUM ('draft', 'in_progress', 'completed', 'certified');

CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES users(id), -- Company user who ordered
    assessor_id UUID REFERENCES assessors(id), -- NULL for self-assessment
    order_id UUID REFERENCES orders(id), -- Link to purchase
    type assessment_type NOT NULL,
    status assessment_status DEFAULT 'draft',
    company_name VARCHAR(255) NOT NULL,
    company_size VARCHAR(50), -- Small, Medium, Large, Enterprise
    industry VARCHAR(100),
    assessment_date DATE,
    completion_date DATE,
    certification_date DATE,
    certification_expiry DATE,
    certificate_number VARCHAR(50) UNIQUE,
    matrix_data JSONB, -- CPF 10x10 matrix results
    overall_score VARCHAR(20), -- Red, Yellow, Green
    risk_areas TEXT[], -- Array of identified risk categories
    recommendations TEXT,
    report_url VARCHAR(500), -- PDF report location
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assessments_company ON assessments(company_id);
CREATE INDEX idx_assessments_assessor ON assessments(assessor_id);
CREATE INDEX idx_assessments_status ON assessments(status);

-- ============================================
-- SHOPPING CART
-- ============================================

CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

CREATE INDEX idx_cart_user ON cart_items(user_id);

-- ============================================
-- SESSIONS (for JWT blacklist and session management)
-- ============================================

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_valid BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- ============================================
-- CONTACT SUBMISSIONS
-- ============================================

CREATE TABLE contact_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    user_type VARCHAR(50), -- ciso, hr, assessor
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contact_submissions_created ON contact_submissions(created_at DESC);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessors_updated_at BEFORE UPDATE ON assessors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INITIAL DATA / SEED
-- See seed.sql for sample products and data
-- ============================================
