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
  vat_number VARCHAR(50),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Italia',
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
  session_id VARCHAR(255),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(session_id, product_id),
  UNIQUE(user_id, product_id),
  CHECK (session_id IS NOT NULL OR user_id IS NOT NULL)
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

-- ============================================================================
-- CERTICREDIA ITALIA - CYBERSECURITY ACCREDITATION PLATFORM
-- Database Schema Extension
-- Version: 2.0
-- ============================================================================

-- ============================================================================
-- 1. AUTHENTICATION & SECURITY TABLES
-- ============================================================================

-- Password Reset Tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- MFA/TOTP Secrets
CREATE TABLE IF NOT EXISTS mfa_secrets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  secret VARCHAR(255) NOT NULL,
  enabled BOOLEAN DEFAULT false,
  backup_codes JSONB, -- Array of hashed backup codes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  enabled_at TIMESTAMP,
  last_used_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mfa_secrets_user_id ON mfa_secrets(user_id);

-- ============================================================================
-- 2. ORGANIZATIONS (ENTI) TABLES
-- ============================================================================

-- Organizations/Enti
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  organization_type VARCHAR(50) NOT NULL CHECK (organization_type IN ('PUBLIC_ENTITY', 'PRIVATE_COMPANY', 'NON_PROFIT')),
  vat_number VARCHAR(50),
  fiscal_code VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Italia',
  phone VARCHAR(50),
  email VARCHAR(255) NOT NULL,
  pec VARCHAR(255), -- Certified email for PA
  website VARCHAR(500),

  -- Billing
  billing_address TEXT,
  billing_city VARCHAR(100),
  billing_postal_code VARCHAR(20),
  billing_country VARCHAR(100) DEFAULT 'Italia',

  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'inactive')),
  verified BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(organization_type);
CREATE INDEX IF NOT EXISTS idx_organizations_email ON organizations(email);
CREATE INDEX IF NOT EXISTS idx_organizations_vat ON organizations(vat_number);

-- Organization Users (many-to-many with roles)
CREATE TABLE IF NOT EXISTS organization_users (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'operator', 'viewer')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_organization_users_org_id ON organization_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_users_user_id ON organization_users(user_id);

-- ============================================================================
-- 3. SPECIALISTS TABLES
-- ============================================================================

-- Specialist Profiles (extends users table)
CREATE TABLE IF NOT EXISTS specialist_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'candidate' CHECK (status IN ('candidate', 'exam_pending', 'active', 'suspended', 'inactive')),

  -- Exam
  exam_attempts INTEGER DEFAULT 0,
  exam_passed BOOLEAN DEFAULT false,
  exam_score DECIMAL(5, 2),
  exam_passed_at TIMESTAMP,

  -- Qualifications
  qualifications TEXT[],
  certifications TEXT[],
  experience_years INTEGER,
  bio TEXT,
  cv_url TEXT,
  linkedin_url VARCHAR(500),

  -- CPE (Continuing Professional Education)
  cpe_hours_current_year DECIMAL(10, 2) DEFAULT 0,
  cpe_hours_total DECIMAL(10, 2) DEFAULT 0,
  cpe_last_check_date DATE,
  cpe_compliant BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activated_at TIMESTAMP,
  suspended_at TIMESTAMP,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_specialist_profiles_user_id ON specialist_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_specialist_profiles_status ON specialist_profiles(status);
CREATE INDEX IF NOT EXISTS idx_specialist_profiles_exam_passed ON specialist_profiles(exam_passed);

-- Specialist Exam Questions Bank
CREATE TABLE IF NOT EXISTS specialist_exam_questions (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of answer options
  correct_answer INTEGER NOT NULL, -- Index of correct option
  explanation TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_exam_questions_category ON specialist_exam_questions(category);
CREATE INDEX IF NOT EXISTS idx_exam_questions_difficulty ON specialist_exam_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_exam_questions_active ON specialist_exam_questions(active);

-- Specialist Exam Attempts
CREATE TABLE IF NOT EXISTS specialist_exam_attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  specialist_profile_id INTEGER REFERENCES specialist_profiles(id) ON DELETE CASCADE,

  -- Exam details
  questions JSONB NOT NULL, -- Array of question IDs used in this attempt
  answers JSONB NOT NULL, -- User's answers
  score DECIMAL(5, 2) NOT NULL,
  passed BOOLEAN NOT NULL,
  time_taken_minutes INTEGER,

  -- Metadata
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_exam_attempts_user_id ON specialist_exam_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_profile_id ON specialist_exam_attempts(specialist_profile_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_completed_at ON specialist_exam_attempts(completed_at DESC);

-- CPE Records
CREATE TABLE IF NOT EXISTS specialist_cpe_records (
  id SERIAL PRIMARY KEY,
  specialist_profile_id INTEGER NOT NULL REFERENCES specialist_profiles(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Activity details
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('training', 'audit', 'research', 'teaching', 'conference', 'other')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  provider VARCHAR(255),
  hours DECIMAL(5, 2) NOT NULL,
  credits DECIMAL(5, 2) NOT NULL,
  activity_date DATE NOT NULL,

  -- Evidence
  certificate_url TEXT,
  evidence_urls TEXT[],

  -- Verification
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_by INTEGER REFERENCES users(id),
  verified_at TIMESTAMP,
  rejection_reason TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cpe_records_specialist_id ON specialist_cpe_records(specialist_profile_id);
CREATE INDEX IF NOT EXISTS idx_cpe_records_user_id ON specialist_cpe_records(user_id);
CREATE INDEX IF NOT EXISTS idx_cpe_records_activity_date ON specialist_cpe_records(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_cpe_records_status ON specialist_cpe_records(status);

-- ============================================================================
-- 4. ASSESSMENT FRAMEWORK TABLES
-- ============================================================================

-- Assessment Templates (Framework versions)
CREATE TABLE IF NOT EXISTS assessment_templates (
  id SERIAL PRIMARY KEY,
  version VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Structure (JSONB for flexibility)
  structure JSONB NOT NULL, -- Sections, subsections, questions

  -- Status
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  active BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  activated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessment_templates_version ON assessment_templates(version);
CREATE INDEX IF NOT EXISTS idx_assessment_templates_status ON assessment_templates(status);
CREATE INDEX IF NOT EXISTS idx_assessment_templates_active ON assessment_templates(active);

-- Assessments (Accreditation instances)
CREATE TABLE IF NOT EXISTS assessments (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id INTEGER NOT NULL REFERENCES assessment_templates(id),

  -- Status workflow
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN (
    'draft',
    'in_progress',
    'submitted',
    'under_review',
    'modification_requested',
    'approved',
    'rejected',
    'expired'
  )),

  -- Responses (JSONB for flexibility)
  responses JSONB, -- User's answers to questions
  completion_percentage DECIMAL(5, 2) DEFAULT 0,

  -- Assignment
  assigned_specialist_id INTEGER REFERENCES users(id),
  assigned_at TIMESTAMP,

  -- Dates
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  approved_at TIMESTAMP,
  expires_at TIMESTAMP,

  -- Approval details
  approved_by INTEGER REFERENCES users(id),
  approval_notes TEXT,
  certificate_url TEXT,
  certificate_hash VARCHAR(255), -- SHA256 hash for integrity

  -- Metadata
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_assessments_organization_id ON assessments(organization_id);
CREATE INDEX IF NOT EXISTS idx_assessments_template_id ON assessments(template_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_assigned_specialist ON assessments(assigned_specialist_id);
CREATE INDEX IF NOT EXISTS idx_assessments_expires_at ON assessments(expires_at);

-- ============================================================================
-- 5. EVIDENCE & FILE STORAGE
-- ============================================================================

-- Evidence Files
CREATE TABLE IF NOT EXISTS evidence_files (
  id SERIAL PRIMARY KEY,
  assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  uploaded_by INTEGER NOT NULL REFERENCES users(id),

  -- File details
  file_name VARCHAR(255) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  mime_type VARCHAR(100),

  -- Storage
  storage_provider VARCHAR(50) NOT NULL CHECK (storage_provider IN ('local', 'aws', 'cloudflare')),
  storage_path TEXT NOT NULL,
  storage_bucket VARCHAR(255),

  -- Security
  file_hash VARCHAR(255), -- SHA256
  encrypted BOOLEAN DEFAULT false,

  -- Context
  question_id VARCHAR(100), -- Which question this evidence supports
  description TEXT,

  -- Metadata
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accessed_at TIMESTAMP,
  access_count INTEGER DEFAULT 0,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_evidence_files_assessment_id ON evidence_files(assessment_id);
CREATE INDEX IF NOT EXISTS idx_evidence_files_organization_id ON evidence_files(organization_id);
CREATE INDEX IF NOT EXISTS idx_evidence_files_uploaded_by ON evidence_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_evidence_files_question_id ON evidence_files(question_id);

-- ============================================================================
-- 6. WORKFLOW & COLLABORATION
-- ============================================================================

-- Specialist Assignments (Access tokens)
CREATE TABLE IF NOT EXISTS specialist_assignments (
  id SERIAL PRIMARY KEY,
  assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  specialist_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

  -- Access token
  access_token VARCHAR(100) NOT NULL UNIQUE,
  token_hash VARCHAR(255) NOT NULL,

  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'revoked')),

  -- Dates
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  completed_at TIMESTAMP,

  -- Metadata
  created_by INTEGER REFERENCES users(id),
  notes TEXT,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_specialist_assignments_assessment_id ON specialist_assignments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_specialist_assignments_organization_id ON specialist_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_specialist_assignments_specialist_id ON specialist_assignments(specialist_id);
CREATE INDEX IF NOT EXISTS idx_specialist_assignments_token_hash ON specialist_assignments(token_hash);
CREATE INDEX IF NOT EXISTS idx_specialist_assignments_status ON specialist_assignments(status);

-- Review Comments
CREATE TABLE IF NOT EXISTS review_comments (
  id SERIAL PRIMARY KEY,
  assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  specialist_id INTEGER NOT NULL REFERENCES users(id),

  -- Comment details
  question_id VARCHAR(100), -- Which question this comment is about (null = general comment)
  comment_type VARCHAR(50) CHECK (comment_type IN ('question', 'suggestion', 'issue', 'approval', 'general')),
  comment TEXT NOT NULL,
  severity VARCHAR(20) CHECK (severity IN ('info', 'warning', 'critical')),

  -- Status
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'addressed', 'resolved', 'dismissed')),
  resolved_at TIMESTAMP,
  resolved_by INTEGER REFERENCES users(id),
  resolution_note TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_review_comments_assessment_id ON review_comments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_specialist_id ON review_comments(specialist_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_question_id ON review_comments(question_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_status ON review_comments(status);

-- ============================================================================
-- 7. AUDIT TRAIL (INDELEBILE)
-- ============================================================================

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,

  -- Who
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  user_role VARCHAR(50),
  organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,

  -- What
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id INTEGER,

  -- Changes
  old_value JSONB,
  new_value JSONB,
  changes JSONB, -- Diff of changes

  -- When & Where
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- Context
  request_id VARCHAR(100),
  session_id VARCHAR(100),
  metadata JSONB
);

-- Partitioning for performance (optional, can be implemented later)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type_id ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- ============================================================================
-- 8. EXTEND EXISTING TABLES
-- ============================================================================

-- Extend users table with new roles
DO $$
BEGIN
  -- Check if the constraint exists and drop it
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_role_check;
  END IF;

  -- Add new constraint with extended roles
  ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('user', 'admin', 'specialist', 'organization_admin', 'organization_operator'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add MFA fields to users table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'mfa_enabled') THEN
    ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'mfa_required') THEN
    ALTER TABLE users ADD COLUMN mfa_required BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_changed_at') THEN
    ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- ============================================================================
-- 9. TRIGGERS FOR AUTO-UPDATE
-- ============================================================================

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables
DO $$
BEGIN
  -- Organizations
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_organizations_updated_at') THEN
    CREATE TRIGGER update_organizations_updated_at
      BEFORE UPDATE ON organizations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Specialist Profiles
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_specialist_profiles_updated_at') THEN
    CREATE TRIGGER update_specialist_profiles_updated_at
      BEFORE UPDATE ON specialist_profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Assessments
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_assessments_updated_at') THEN
    CREATE TRIGGER update_assessments_updated_at
      BEFORE UPDATE ON assessments
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Assessment Templates
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_assessment_templates_updated_at') THEN
    CREATE TRIGGER update_assessment_templates_updated_at
      BEFORE UPDATE ON assessment_templates
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Review Comments
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_review_comments_updated_at') THEN
    CREATE TRIGGER update_review_comments_updated_at
      BEFORE UPDATE ON review_comments
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
-- ============================================================================
-- CERTICREDIA ITALIA - CPF AUDITING DASHBOARD
-- Database Schema for CPF Auditing Assessments
-- Version: 1.0
-- ============================================================================

-- ============================================================================
-- CPF AUDITING ASSESSMENTS TABLE
-- ============================================================================
-- Stores CPF (Cognitive Persuasion Framework) auditing assessment data
-- for organizations. Each organization has one current assessment with
-- 100 indicators organized in categories.

CREATE TABLE IF NOT EXISTS cpf_auditing_assessments (
  id SERIAL PRIMARY KEY,

  -- Organization reference
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Assessment data (100 CPF indicators in JSON format)
  -- Structure: {
  --   "1-1": {"value": 0-3, "notes": "...", "last_updated": "2025-12-31T12:00:00Z"},
  --   "1-2": {...},
  --   ...
  -- }
  assessment_data JSONB NOT NULL DEFAULT '{}',

  -- Metadata
  -- Additional data like maturity scores, risk levels, completion %, etc.
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_assessment_date TIMESTAMP,

  -- Soft delete (for trash functionality)
  deleted_at TIMESTAMP,

  -- One assessment per organization (unless deleted)
  UNIQUE(organization_id, deleted_at)
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_cpf_auditing_org_id ON cpf_auditing_assessments(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cpf_auditing_updated_at ON cpf_auditing_assessments(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_cpf_auditing_deleted_at ON cpf_auditing_assessments(deleted_at) WHERE deleted_at IS NOT NULL;

-- GIN index for JSONB querying
CREATE INDEX IF NOT EXISTS idx_cpf_auditing_data ON cpf_auditing_assessments USING GIN (assessment_data);
CREATE INDEX IF NOT EXISTS idx_cpf_auditing_metadata ON cpf_auditing_assessments USING GIN (metadata);

-- Trigger to update updated_at on modification
CREATE OR REPLACE FUNCTION update_cpf_auditing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cpf_auditing_updated_at ON cpf_auditing_assessments;
CREATE TRIGGER trigger_cpf_auditing_updated_at
  BEFORE UPDATE ON cpf_auditing_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_cpf_auditing_updated_at();

-- Comments
COMMENT ON TABLE cpf_auditing_assessments IS 'CPF Auditing assessment data for organizations';
COMMENT ON COLUMN cpf_auditing_assessments.organization_id IS 'Reference to organizations table';
COMMENT ON COLUMN cpf_auditing_assessments.assessment_data IS 'JSON object with 100 CPF indicators (key: indicator_id, value: {value, notes, last_updated})';
COMMENT ON COLUMN cpf_auditing_assessments.metadata IS 'Additional metadata: maturity_level, completion_percentage, risk_score, etc.';
COMMENT ON COLUMN cpf_auditing_assessments.deleted_at IS 'Soft delete timestamp for trash functionality';
