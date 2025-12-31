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
