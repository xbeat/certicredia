# CertiCredia - Architettura e Funzionamento Approfondito

**Documento di Architettura Tecnica v2.0**

---

## Indice

1. [Panoramica Architetturale](#panoramica-architetturale)
2. [Moduli Core](#moduli-core)
3. [Database Schema Dettagliato](#database-schema-dettagliato)
4. [Flussi di Lavoro Completi](#flussi-di-lavoro-completi)
5. [Sicurezza Implementata](#sicurezza-implementata)
6. [API Reference Completa](#api-reference-completa)
7. [Frontend Architecture](#frontend-architecture)
8. [Estensibilità e Personalizzazione](#estensibilit%C3%A0-e-personalizzazione)
9. [Performance e Scalabilità](#performance-e-scalabilit%C3%A0)
10. [Troubleshooting Avanzato](#troubleshooting-avanzato)

---

## 1. Panoramica Architetturale

### 1.1 Design Principles

Il sistema CertiCredia è stato progettato seguendo questi principi fondamentali:

- **Modularità**: Ogni funzionalità è isolata in un modulo indipendente
- **Separation of Concerns**: Business logic separata da data access e presentation
- **Multi-tenancy**: Isolamento completo dei dati per organizzazione
- **Audit-first**: Ogni operazione critica è tracciata in modo indelebile
- **Security by Design**: Sicurezza integrata a ogni livello
- **API-first**: Backend completamente esposto via REST API

### 1.2 Layered Architecture

```
┌─────────────────────────────────────────┐
│         FRONTEND LAYER                   │
│  (Vanilla JS, HTML, CSS - Tailwind)     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         API LAYER (Express.js)           │
│  - Routes                                │
│  - Middleware (Auth, Validation, Audit)  │
│  - Controllers                           │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      BUSINESS LOGIC LAYER                │
│  - Services (modules/*/services/)        │
│  - Domain Logic                          │
│  - Business Rules                        │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      DATA ACCESS LAYER                   │
│  - PostgreSQL (via pg driver)            │
│  - Query Building                        │
│  - Transactions                          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│    EXTERNAL SERVICES LAYER               │
│  - S3/R2 (Evidence Storage)              │
│  - Resend (Email)                        │
│  - PDFKit (Report Generation)            │
└─────────────────────────────────────────┘
```

### 1.3 Module Structure

Ogni modulo segue una struttura standardizzata:

```
modules/<module-name>/
├── services/           # Business logic
│   └── <module>Service.js
├── controllers/        # HTTP handlers
│   └── <module>Controller.js
├── routes/            # API endpoints
│   └── <module>Routes.js
├── middleware/        # Module-specific middleware
│   └── <module>Middleware.js
└── README.md          # Module documentation
```

---

## 2. Moduli Core

### 2.1 Auth Module

**Path**: `modules/auth/`

**Responsabilità**:
- Gestione registrazione e login utenti
- JWT token generation/validation
- MFA/TOTP implementation
- Password recovery con token via email
- Password policy enforcement

**Componenti Chiave**:

1. **passwordService.js**: Password recovery logic
   - Genera token sicuri (crypto.randomBytes)
   - Invia email con link reset
   - Valida token con scadenza
   - Hash token con SHA256 per storage

2. **mfaService.js**: Two-Factor Authentication
   - Setup MFA con QR code (speakeasy)
   - 10 backup codes hashed (SHA256)
   - Verifica TOTP con window di 2 step (±60s)
   - Tracking ultimo utilizzo

3. **passwordController.js**: API handlers
   - `/forgot-password`: Richiesta reset
   - `/reset-password`: Reset con token
   - `/validate-reset-token/:token`: Verifica validità

**Flow Password Recovery**:

```
1. User → POST /api/auth/forgot-password {email}
   ↓
2. Backend checks user exists
   ↓
3. Generate random token (64 char hex)
   ↓
4. Hash token with SHA256 → Store in DB
   ↓
5. Send email with reset URL + plain token
   ↓
6. User clicks link → GET /reset-password?token=xxx
   ↓
7. Frontend validates token → POST /api/auth/reset-password
   ↓
8. Backend verifies token hash + expiry
   ↓
9. Update password → Mark token as used
```

**MFA Flow**:

```
1. User → POST /api/auth/mfa/setup
   ↓
2. Generate speakeasy secret (base32, 32 chars)
   ↓
3. Create QR code (otpauth:// URL)
   ↓
4. Generate 10 backup codes → Hash and store
   ↓
5. Return QR + secret + backup codes
   ↓
6. User scans QR with Google Authenticator
   ↓
7. User → POST /api/auth/mfa/verify {token}
   ↓
8. Verify TOTP → Enable MFA
   ↓
9. On login: POST /api/auth/mfa/validate {userId, token}
   ↓
10. Verify TOTP or backup code → Grant access
```

### 2.2 Organizations Module

**Path**: `modules/organizations/`

**Responsabilità**:
- Multi-tenant organization management
- User-Organization associations (RBAC)
- Organization lifecycle (pending → active → suspended)

**Database Tables**:
- `organizations`: Organization data
- `organization_users`: Many-to-many with roles

**Roles**:
- `admin`: Full organization control
- `operator`: Can edit assessments
- `viewer`: Read-only access

**Multi-tenancy Implementation**:

Ogni operazione DEVE filtrare per `organization_id`:

```javascript
// CORRETTO - Multi-tenant query
const assessments = await pool.query(
  'SELECT * FROM assessments WHERE organization_id = $1',
  [req.user.organizationId]
);

// SBAGLIATO - Espone dati di tutte le org
const assessments = await pool.query('SELECT * FROM assessments');
```

Middleware per auto-injection organization_id:

```javascript
export const injectOrganizationId = (req, res, next) => {
  if (req.user && req.user.organizationId) {
    req.body.organizationId = req.user.organizationId;
    req.query.organizationId = req.user.organizationId;
  }
  next();
};
```

### 2.3 Specialists Module

**Path**: `modules/specialists/`

**Responsabilità**:
- Specialist registration and qualification
- Exam engine con randomizzazione
- CPE (Continuing Professional Education) tracking
- Compliance verification

**Exam System**:

**Question Bank Structure**:
```sql
specialist_exam_questions:
  - id: SERIAL PRIMARY KEY
  - category: VARCHAR (Governance, Risk, Technical, etc.)
  - difficulty: ENUM (easy, medium, hard)
  - question: TEXT
  - options: JSONB → [{text, isCorrect}]
  - correct_answer: INTEGER (index)
  - explanation: TEXT
  - active: BOOLEAN
```

**Exam Generation Algorithm**:

```javascript
// Stratified sampling per difficulty
const questions = await pool.query(`
  (SELECT * FROM specialist_exam_questions
   WHERE active = true AND difficulty = 'easy'
   ORDER BY RANDOM() LIMIT 15)
  UNION ALL
  (SELECT * FROM specialist_exam_questions
   WHERE active = true AND difficulty = 'medium'
   ORDER BY RANDOM() LIMIT 25)
  UNION ALL
  (SELECT * FROM specialist_exam_questions
   WHERE active = true AND difficulty = 'hard'
   ORDER BY RANDOM() LIMIT 10)
`);

// Final shuffle
const exam = shuffleArray(questions.rows);
```

**Scoring**:

```javascript
const score = (correctAnswers / totalQuestions) * 100;
const passed = score >= EXAM_CONFIG.passingScore; // 80%

if (passed) {
  // Update specialist profile
  await pool.query(`
    UPDATE specialist_profiles
    SET exam_passed = true,
        exam_score = $1,
        status = 'active',
        activated_at = CURRENT_TIMESTAMP
    WHERE user_id = $2
  `, [score, userId]);
}
```

**CPE Tracking**:

Annual requirement: 40 hours (configurable via `SPECIALIST_CPE_ANNUAL_HOURS`)

```javascript
// Add CPE record
await pool.query(`
  INSERT INTO specialist_cpe_records (
    specialist_profile_id, activity_type, title,
    hours, credits, activity_date
  ) VALUES ($1, $2, $3, $4, $5, $6)
`, [profileId, type, title, hours, credits, date]);

// Update current year total
await pool.query(`
  UPDATE specialist_profiles
  SET cpe_hours_current_year = cpe_hours_current_year + $1
  WHERE id = $2
`, [credits, profileId]);
```

**Annual Compliance Check** (Cron job - Jan 1st):

```javascript
// Suspend non-compliant specialists
await pool.query(`
  UPDATE specialist_profiles
  SET status = 'suspended', cpe_compliant = false
  WHERE cpe_hours_current_year < 40 AND status = 'active'
`);

// Reset counters
await pool.query(`
  UPDATE specialist_profiles
  SET cpe_hours_current_year = 0,
      cpe_last_check_date = CURRENT_DATE
`);
```

### 2.4 Assessments Module

**Path**: `modules/assessments/`

**Responsabilità**:
- Assessment template management (versioning)
- Assessment instance creation
- Response storage (JSONB)
- Completion tracking

**Template Structure** (JSONB):

```json
{
  "version": "1.0",
  "sections": [
    {
      "id": "governance",
      "title": "Governance e Organizzazione",
      "weight": 25,
      "subsections": [
        {
          "id": "policies",
          "title": "Politiche di Sicurezza",
          "questions": [
            {
              "id": "q1",
              "type": "textarea",
              "required": true,
              "evidenceRequired": true,
              "question": "Descrivere le politiche...",
              "hints": ["Include riferimenti normativi", "Documenta processi"]
            }
          ]
        }
      ]
    }
  ]
}
```

**Response Storage** (JSONB in `assessments.responses`):

```json
{
  "q1": {
    "answer": "La nostra organizzazione ha implementato...",
    "evidenceIds": [123, 124],
    "lastModified": "2025-01-15T10:30:00Z",
    "modifiedBy": 42
  },
  "q2": {
    "answer": "...",
    "evidenceIds": [],
    "lastModified": "2025-01-15T11:00:00Z",
    "modifiedBy": 42
  }
}
```

**Versioning Strategy**:

- Organizations start assessment with template vX.Y
- Can complete assessment with vX.Y even if vX.Z is released
- `assessments.template_id` locks to specific version
- New organizations use latest active template

### 2.5 Evidence Module

**Path**: `modules/evidence/`

**Responsabilità**:
- Secure file upload to S3/Cloudflare R2
- File metadata tracking
- Signed URL generation (time-limited access)
- File integrity verification (SHA256)

**Storage Architecture**:

```
Cloudflare R2 Bucket: certicredia-evidence
├── assessments/
│   ├── <assessment-id>/
│   │   ├── <timestamp>-<random>.pdf
│   │   ├── <timestamp>-<random>.docx
│   │   └── ...
```

**Upload Flow**:

```javascript
1. Frontend → POST /api/evidence (multipart/form-data)
   File: <binary>
   Metadata: {assessmentId, organizationId, questionId}

2. Middleware: multer file validation
   - Check size (max 50MB)
   - Check extension (pdf, doc, docx, xls, xlsx, png, jpg, zip)

3. Service: Calculate SHA256 hash
   const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

4. Service: Upload to S3/R2
   await s3Client.send(new PutObjectCommand({
     Bucket: 'certicredia-evidence',
     Key: `assessments/${assessmentId}/${Date.now()}-${randomHex()}.${ext}`,
     Body: file.buffer,
     ContentType: file.mimetype,
     Metadata: {...}
   }));

5. Service: Save metadata to DB
   INSERT INTO evidence_files (
     assessment_id, organization_id, uploaded_by,
     file_name, file_size_bytes, storage_path, file_hash
   ) VALUES (...)

6. Return evidence ID to frontend
```

**Download Flow** (Signed URLs):

```javascript
1. Frontend → GET /api/evidence/:id/download

2. Backend: Check user has access to organization

3. Backend: Generate signed URL (expires in 1h)
   const command = new GetObjectCommand({
     Bucket: evidence.storage_bucket,
     Key: evidence.storage_path
   });

   const signedUrl = await getSignedUrl(s3Client, command, {
     expiresIn: 3600 // 1 hour
   });

4. Return {url, expiresIn, fileName}

5. Frontend: window.open(signedUrl) → Direct download from S3/R2
```

**Security**:
- Files are NOT publicly accessible
- Signed URLs expire after 1h (configurable)
- Access tracking: `accessed_at`, `access_count`
- SHA256 hash verification on upload

### 2.6 Workflow Module

**Path**: `modules/workflow/`

**Responsabilità**:
- Assessment state machine
- Specialist assignment (token-based)
- Review comments system
- Status transition validation

**State Machine**:

```
         ┌─────┐
         │Draft│
         └──┬──┘
            │
            ↓
      ┌───────────┐
      │In Progress│
      └─────┬─────┘
            │
            ↓
       ┌─────────┐
       │Submitted│
       └────┬────┘
            │
            ↓
      ┌────────────┐
      │Under Review│
      └──┬──────┬──┘
         │      │
         ↓      ↓
    ┌────────┐ ┌────────┐
    │Approved│ │Rejected│
    └────────┘ └────────┘
         │
         ↓
    ┌────────┐
    │Expired │
    └────────┘
```

**Valid Transitions**:

```javascript
const VALID_TRANSITIONS = {
  'draft': ['in_progress', 'submitted'],
  'in_progress': ['submitted'],
  'submitted': ['under_review', 'modification_requested'],
  'under_review': ['modification_requested', 'approved', 'rejected'],
  'modification_requested': ['in_progress'],
  'approved': ['expired'],
  'rejected': [],
  'expired': []
};

// Transition validation
function canTransition(currentStatus, newStatus) {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
}
```

**Specialist Assignment Token System**:

```javascript
// Generate token
const token = `ACC-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
// Example: ACC-1705320000000-A3F2B8C1

const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72h

await pool.query(`
  INSERT INTO specialist_assignments (
    assessment_id, organization_id, access_token, token_hash, expires_at
  ) VALUES ($1, $2, $3, $4, $5)
`, [assessmentId, orgId, token, tokenHash, expiresAt]);

// Return plain token to organization (SHOW ONLY ONCE)
return { token, expiresAt };
```

**Token Acceptance**:

```javascript
// Specialist uses token
const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

const assignment = await pool.query(`
  SELECT * FROM specialist_assignments
  WHERE token_hash = $1
    AND status = 'pending'
    AND expires_at > CURRENT_TIMESTAMP
`, [tokenHash]);

if (assignment.rows.length === 0) {
  throw new Error('Token invalid or expired');
}

// Accept assignment
await pool.query(`
  UPDATE specialist_assignments
  SET specialist_id = $1, status = 'accepted', accepted_at = CURRENT_TIMESTAMP
  WHERE id = $2
`, [specialistId, assignment.rows[0].id]);

// Update assessment
await pool.query(`
  UPDATE assessments
  SET assigned_specialist_id = $1, assigned_at = CURRENT_TIMESTAMP
  WHERE id = $2
`, [specialistId, assessmentId]);
```

**Review Comments**:

```javascript
// Add comment
await pool.query(`
  INSERT INTO review_comments (
    assessment_id, specialist_id, question_id,
    comment_type, comment, severity, status
  ) VALUES ($1, $2, $3, $4, $5, $6, 'open')
`, [assessmentId, specialistId, questionId, type, comment, severity]);

// Comment types: question, suggestion, issue, approval, general
// Severity: info, warning, critical
```

### 2.7 Audit Module

**Path**: `modules/audit/`

**Responsabilità**:
- Indelebile audit logging
- Change tracking (old/new values with diff)
- Sensitive data masking
- Query and reporting API

**Audit Log Structure**:

```sql
audit_logs:
  - id: BIGSERIAL (can handle billions of records)
  - user_id: INT (who)
  - user_email: VARCHAR (for historical reference)
  - organization_id: INT (context)
  - action: VARCHAR (USER_LOGIN, ASSESSMENT_CREATED, etc.)
  - entity_type: VARCHAR (user, assessment, organization)
  - entity_id: INT (which record)
  - old_value: JSONB (before state)
  - new_value: JSONB (after state)
  - changes: JSONB (computed diff)
  - timestamp: TIMESTAMP (when)
  - ip_address: VARCHAR
  - user_agent: TEXT
  - request_id: VARCHAR (correlate logs)
  - metadata: JSONB (additional context)
```

**Masking Sensitive Fields**:

```javascript
const SENSITIVE_FIELDS = ['password', 'password_hash', 'mfa_secret', 'credit_card'];

function maskSensitiveFields(data) {
  if (!data || typeof data !== 'object') return data;

  const masked = { ...data };

  for (const field of SENSITIVE_FIELDS) {
    if (field in masked) {
      masked[field] = '***MASKED***';
    }
  }

  // Recursive for nested objects
  for (const key in masked) {
    if (typeof masked[key] === 'object' && !Array.isArray(masked[key])) {
      masked[key] = maskSensitiveFields(masked[key]);
    }
  }

  return masked;
}
```

**Change Diff Calculation**:

```javascript
function calculateChanges(oldValue, newValue) {
  const changes = {};

  for (const key in newValue) {
    if (JSON.stringify(oldValue[key]) !== JSON.stringify(newValue[key])) {
      changes[key] = {
        from: oldValue[key],
        to: newValue[key]
      };
    }
  }

  return changes;
}

// Example:
// oldValue: {name: 'Acme', status: 'pending'}
// newValue: {name: 'Acme Corp', status: 'active'}
// changes: {
//   name: {from: 'Acme', to: 'Acme Corp'},
//   status: {from: 'pending', to: 'active'}
// }
```

**Usage in Code**:

```javascript
import { auditLog } from '../../audit/services/auditService.js';

// In any service method
await auditLog({
  userId: req.user.id,
  userEmail: req.user.email,
  organizationId: req.user.organizationId,
  action: 'ASSESSMENT_SUBMITTED',
  entityType: 'assessment',
  entityId: assessmentId,
  oldValue: { status: 'in_progress' },
  newValue: { status: 'submitted' },
  req: req, // Auto-extract IP, user-agent
  metadata: { submittedFrom: 'dashboard' }
});
```

**Querying Audit Logs**:

```javascript
// Get all changes for an assessment
const logs = await queryAuditLogs({
  entityType: 'assessment',
  entityId: 123,
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  limit: 100,
  offset: 0
});

// Get user activity
const userActivity = await queryAuditLogs({
  userId: 42,
  startDate: '2025-01-15',
  limit: 50
});
```

---

## 3. Database Schema Dettagliato

### 3.1 Relational Model

```
users ─┬─→ organization_users ←─ organizations
       │
       ├─→ specialist_profiles ─→ specialist_cpe_records
       │                      └─→ specialist_exam_attempts
       │
       ├─→ assessments ─┬─→ evidence_files
       │                ├─→ review_comments
       │                └─→ specialist_assignments
       │
       ├─→ mfa_secrets
       ├─→ password_reset_tokens
       └─→ audit_logs

assessment_templates ─→ assessments
```

### 3.2 Key Tables Deep Dive

**`assessments` table**:

```sql
CREATE TABLE assessments (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id INT NOT NULL REFERENCES assessment_templates(id),

  -- Workflow
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN (...)),

  -- Data (JSONB for flexibility)
  responses JSONB, -- User answers
  completion_percentage DECIMAL(5,2) DEFAULT 0,

  -- Assignment
  assigned_specialist_id INT REFERENCES users(id),
  assigned_at TIMESTAMP,

  -- Timeline
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  approved_at TIMESTAMP,
  expires_at TIMESTAMP, -- 12 months after approval

  -- Approval details
  approved_by INT REFERENCES users(id),
  approval_notes TEXT,
  certificate_url TEXT,
  certificate_hash VARCHAR(255), -- SHA256 for integrity

  metadata JSONB
);

-- Indices for performance
CREATE INDEX idx_assessments_organization_id ON assessments(organization_id);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessments_expires_at ON assessments(expires_at);
```

**Why JSONB for `responses`?**

1. **Flexibility**: Assessment structure can change without DB migration
2. **Querying**: PostgreSQL supports JSONB queries (`responses->>'q1'`)
3. **Indexing**: Can create GIN index for fast lookups
4. **Versioning**: Different template versions coexist

**`specialist_profiles` table**:

```sql
CREATE TABLE specialist_profiles (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Status lifecycle
  status VARCHAR(50) DEFAULT 'candidate' CHECK (status IN (
    'candidate',      -- Registered, not passed exam
    'exam_pending',   -- Taking exam
    'active',         -- Qualified specialist
    'suspended',      -- CPE non-compliant or admin action
    'inactive'        -- Voluntary suspension
  )),

  -- Exam
  exam_attempts INT DEFAULT 0,
  exam_passed BOOLEAN DEFAULT false,
  exam_score DECIMAL(5,2),
  exam_passed_at TIMESTAMP,

  -- Qualifications
  qualifications TEXT[],      -- Array of certifications
  certifications TEXT[],
  experience_years INT,
  bio TEXT,
  cv_url TEXT,
  linkedin_url VARCHAR(500),

  -- CPE tracking
  cpe_hours_current_year DECIMAL(10,2) DEFAULT 0,
  cpe_hours_total DECIMAL(10,2) DEFAULT 0,
  cpe_last_check_date DATE,
  cpe_compliant BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activated_at TIMESTAMP,
  suspended_at TIMESTAMP,
  metadata JSONB
);
```

**`audit_logs` table** (Partitioning strategy for scale):

```sql
-- Main table
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id INT,
  organization_id INT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id INT,
  old_value JSONB,
  new_value JSONB,
  changes JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB
);

-- Partition by year (for long-term storage)
CREATE TABLE audit_logs_2025 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Indices
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
```

### 3.3 JSONB Indexing for Performance

```sql
-- Index for fast response lookup
CREATE INDEX idx_assessments_responses_gin ON assessments USING GIN (responses);

-- Query specific question answer
SELECT responses->>'q1' as answer
FROM assessments
WHERE organization_id = 123 AND responses ? 'q1';

-- Find assessments with specific answer pattern
SELECT * FROM assessments
WHERE responses->>'q5' ILIKE '%ISO 27001%';
```

---

## 4. Flussi di Lavoro Completi

### 4.1 Onboarding Completo Ente

```
1. REGISTRAZIONE UTENTE
   User fills form → POST /api/auth/register
   {
     email, password, name, company
   }
   ↓
   Backend:
   - Validates password policy
   - Hashes password (bcrypt 12 rounds)
   - Creates user with role='user'
   - Sends welcome email
   - Returns JWT token

2. CREAZIONE ORGANIZZAZIONE
   User → POST /api/organizations
   {
     name: "Acme Corp",
     organizationType: "PRIVATE_COMPANY",
     vatNumber: "IT12345678901",
     email: "info@acme.com",
     ...
   }
   ↓
   Backend:
   - Creates organization with status='pending'
   - Links user as organization admin
   - Audit log: ORGANIZATION_CREATED

3. ATTIVAZIONE MANUALE (Admin)
   Admin → PATCH /api/organizations/:id/status
   { status: "active" }
   ↓
   Organization can now create assessments

4. CREAZIONE ASSESSMENT
   User → POST /api/assessments
   { organizationId: 123, templateId: 1 }
   ↓
   Backend:
   - Gets active template structure
   - Creates assessment with status='draft'
   - Initializes empty responses JSONB

5. COMPILAZIONE DASHBOARD
   User fills questions → Auto-save every 30s
   ↓
   PATCH /api/assessments/:id
   {
     responses: { q1: "...", q2: "..." },
     completion_percentage: 45
   }

6. UPLOAD EVIDENCE
   User attaches file → POST /api/evidence
   ↓
   - Upload to S3/R2
   - Calculate SHA256
   - Store metadata in DB
   - Link to question: evidence_files.question_id

7. SUBMIT ASSESSMENT
   User → PATCH /api/assessments/:id/status
   { status: "submitted" }
   ↓
   Backend:
   - Validates completion >= 80%
   - Locks responses (read-only)
   - Audit log: ASSESSMENT_SUBMITTED

8. GENERA TOKEN SPECIALIST
   User → POST /api/assessments/:id/assign-token
   ↓
   Backend returns: ACC-1705320000-A3F2B8C1
   ↓
   User sends token to Specialist via email/phone

9. SPECIALIST ACCEPTS
   Specialist → POST /api/assessments/accept/:token
   ↓
   Backend:
   - Validates token (not expired)
   - Links specialist to assessment
   - Updates status → 'under_review'

10. REVISIONE SPECIALIST
    Specialist reviews → Adds comments
    ↓
    POST /api/reviews/comments
    {
      assessmentId, questionId,
      comment: "Evidence insufficiente per q5",
      severity: "warning"
    }
    ↓
    If issues → Status: 'modification_requested'
    If approved → Status: 'approved'

11. APPROVAZIONE
    Specialist → PATCH /api/assessments/:id/status
    { status: "approved" }
    ↓
    Backend:
    - Sets approved_at = NOW()
    - Sets expires_at = NOW() + 12 months
    - Generates PDF certificate
    - Calculates SHA256 hash
    - Stores certificate_url
    - Audit log: ASSESSMENT_APPROVED

12. DOWNLOAD CERTIFICATO
    User → GET /api/reports/certificate/:assessmentId
    ↓
    Returns PDF with:
    - Organization details
    - Framework version
    - Approval date
    - Expiry date
    - Specialist name
    - Document hash (for integrity)
```

### 4.2 Specialist Qualification Journey

```
1. CANDIDATURA
   User → POST /api/specialists/register
   {
     experienceYears: 5,
     qualifications: ["CISSP", "CEH"],
     bio: "...",
     cvUrl: "https://..."
   }
   ↓
   Backend:
   - Updates user role='specialist'
   - Creates specialist_profile with status='candidate'
   - exam_attempts = 0

2. GENERAZIONE ESAME
   Candidate → POST /api/specialists/exam/start
   ↓
   Backend:
   - Checks attempts < 3
   - Randomizes 50 questions (15 easy, 25 medium, 10 hard)
   - Creates exam_attempt record
   - Returns questions (WITHOUT correct answers)
   ↓
   Frontend displays exam with 120min timer

3. COMPLETAMENTO ESAME
   Candidate completes → POST /api/specialists/exam/submit
   {
     attemptId: 123,
     answers: [
       {questionId: 1, selectedAnswer: 2},
       {questionId: 2, selectedAnswer: 0},
       ...
     ]
   }
   ↓
   Backend:
   - Fetches questions with correct_answer
   - Calculates score
   - score = (correctAnswers / 50) * 100
   - passed = score >= 80
   ↓
   If passed:
     - status → 'active'
     - exam_passed = true
     - activated_at = NOW()
     - Audit log: SPECIALIST_EXAM_PASSED
   If failed:
     - exam_attempts++
     - status remains 'candidate'
     - Can retry if attempts < 3

4. REGISTRAZIONE CPE
   Specialist → POST /api/specialists/cpe
   {
     activityType: "training",
     title: "Advanced Penetration Testing",
     hours: 16,
     credits: 16,
     activityDate: "2025-01-15",
     certificateUrl: "https://..."
   }
   ↓
   Backend:
   - Creates cpe_record
   - Updates cpe_hours_current_year
   - Updates cpe_hours_total

5. COMPLIANCE ANNUALE (Cron - Jan 1st)
   System checks all specialists:
   ↓
   SELECT * FROM specialist_profiles
   WHERE cpe_hours_current_year < 40 AND status = 'active'
   ↓
   For each non-compliant:
   - status → 'suspended'
   - cpe_compliant = false
   - Sends notification email
   ↓
   Reset all:
   - cpe_hours_current_year = 0
   - cpe_last_check_date = CURRENT_DATE
```

---

## 5. Sicurezza Implementata

### 5.1 Authentication Layers

**Layer 1: Password Security**

```javascript
// Storage
const passwordHash = await bcrypt.hash(password, 12); // 12 rounds

// Validation
const policy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecial: true
};

// Verification
const isValid = await bcrypt.compare(inputPassword, storedHash);
```

**Layer 2: JWT Tokens**

```javascript
// Token generation
const payload = {
  id: user.id,
  email: user.email,
  role: user.role,
  organizationId: user.organizationId
};

const accessToken = jwt.sign(payload, JWT_SECRET, {
  expiresIn: '7d',
  issuer: 'certicredia.org',
  audience: 'certicredia-users'
});

// Token validation (middleware)
const decoded = jwt.verify(token, JWT_SECRET);
req.user = decoded;
```

**Layer 3: MFA/TOTP**

```javascript
// Setup
const secret = speakeasy.generateSecret({
  name: 'CertiCredia (user@example.com)',
  issuer: 'CertiCredia',
  length: 32
});

const qrCode = await QRCode.toDataURL(secret.otpauth_url);

// Verification
const verified = speakeasy.totp.verify({
  secret: storedSecret,
  encoding: 'base32',
  token: userInput,
  window: 2 // ±60 seconds tolerance
});
```

**Layer 4: Role-Based Access Control (RBAC)**

```javascript
// Middleware
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Usage
router.post('/admin/users',
  authenticate,
  requireRole(['admin']),
  createUser
);
```

### 5.2 Input Validation

**express-validator usage**:

```javascript
router.post('/organizations', [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name required')
    .isLength({ max: 255 })
    .withMessage('Name too long'),

  body('email')
    .isEmail()
    .withMessage('Invalid email')
    .normalizeEmail(),

  body('vatNumber')
    .optional()
    .matches(/^[A-Z]{2}\d{11}$/)
    .withMessage('Invalid VAT format')
], validate, createOrganization);

// validate middleware
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};
```

### 5.3 SQL Injection Prevention

**NEVER concatenate user input**:

```javascript
// ❌ VULNERABLE
const query = `SELECT * FROM users WHERE email = '${req.body.email}'`;
await pool.query(query);

// ✅ SAFE - Parameterized query
const query = 'SELECT * FROM users WHERE email = $1';
await pool.query(query, [req.body.email]);
```

**Escaping in JSONB queries**:

```javascript
// Safe JSONB query
const query = `
  SELECT * FROM assessments
  WHERE organization_id = $1
    AND responses ? $2
`;
await pool.query(query, [orgId, questionId]);
```

### 5.4 XSS Prevention

**Output encoding in frontend**:

```javascript
// Don't use innerHTML with user data
// ❌ element.innerHTML = userInput;

// ✅ Use textContent
element.textContent = userInput;

// Or sanitize
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
```

### 5.5 Rate Limiting

```javascript
import rateLimit from 'express-rate-limit';

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per IP
  message: 'Too many requests, please try again later'
});

// Stricter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Max 10 login attempts
  skipSuccessfulRequests: true
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
```

### 5.6 CORS Configuration

```javascript
import cors from 'cors';

const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  optionsSuccessStatus: 200
};

// Production: restrict to specific domains
if (process.env.NODE_ENV === 'production') {
  corsOptions.origin = [
    'https://certicredia.org',
    'https://www.certicredia.org'
  ];
}

app.use(cors(corsOptions));
```

---

## 6. API Reference Completa

### 6.1 Authentication Endpoints

**POST /api/auth/register**

Request:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "Mario Rossi",
  "company": "Acme Corp",
  "phone": "+39 333 1234567"
}
```

Response (201):
```json
{
  "success": true,
  "message": "Registrazione completata",
  "data": {
    "user": {
      "id": 42,
      "email": "user@example.com",
      "name": "Mario Rossi",
      "role": "user"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**POST /api/auth/login**

Request:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

Response (200):
```json
{
  "success": true,
  "message": "Login effettuato",
  "data": {
    "user": {
      "id": 42,
      "email": "user@example.com",
      "name": "Mario Rossi",
      "role": "user",
      "mfaEnabled": true,
      "mfaRequired": false
    },
    "requireMFA": true,
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

If MFA enabled:
```json
{
  "success": false,
  "message": "MFA required",
  "data": {
    "userId": 42,
    "requireMFA": true
  }
}
```

**POST /api/auth/mfa/validate**

Request:
```json
{
  "userId": 42,
  "token": "123456"
}
```

Response (200):
```json
{
  "success": true,
  "message": "Codice verificato",
  "data": {
    "method": "totp",
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### 6.2 Organizations Endpoints

**POST /api/organizations**

Headers:
```
Authorization: Bearer <token>
```

Request:
```json
{
  "name": "Acme Corp S.r.l.",
  "organizationType": "PRIVATE_COMPANY",
  "vatNumber": "IT12345678901",
  "fiscalCode": "RSSMRA80A01H501U",
  "address": "Via Roma 123",
  "city": "Milano",
  "postalCode": "20100",
  "country": "Italia",
  "phone": "+39 02 12345678",
  "email": "info@acme.com",
  "pec": "acme@pec.it",
  "website": "https://acme.com"
}
```

Response (201):
```json
{
  "success": true,
  "message": "Organizzazione creata",
  "data": {
    "id": 123,
    "name": "Acme Corp S.r.l.",
    "status": "pending",
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

**GET /api/organizations?status=active&search=acme**

Response (200):
```json
{
  "success": true,
  "data": {
    "organizations": [...],
    "total": 24,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### 6.3 Specialist Endpoints

**POST /api/specialists/register**

Headers:
```
Authorization: Bearer <token>
```

Request:
```json
{
  "experienceYears": 5,
  "qualifications": ["CISSP", "CEH", "OSCP"],
  "certifications": ["ISO 27001 Lead Auditor"],
  "bio": "Cybersecurity professional with 5+ years...",
  "cvUrl": "https://...",
  "linkedinUrl": "https://linkedin.com/in/..."
}
```

Response (201):
```json
{
  "success": true,
  "message": "Registrazione specialist completata",
  "data": {
    "id": 456,
    "user_id": 42,
    "status": "candidate",
    "exam_attempts": 0
  }
}
```

**POST /api/specialists/exam/start**

Response (200):
```json
{
  "success": true,
  "data": {
    "attemptId": 789,
    "questions": [
      {
        "id": 1,
        "category": "Governance",
        "difficulty": "medium",
        "question": "What is ISO 27001?",
        "options": [
          {"text": "Security standard", "value": 0},
          {"text": "Privacy regulation", "value": 1}
        ]
      }
    ],
    "timeLimit": 120,
    "passingScore": 80,
    "attemptNumber": 1,
    "maxAttempts": 3
  }
}
```

**POST /api/specialists/exam/submit**

Request:
```json
{
  "attemptId": 789,
  "answers": [
    {"questionId": 1, "selectedAnswer": 0},
    {"questionId": 2, "selectedAnswer": 2}
  ]
}
```

Response (200):
```json
{
  "success": true,
  "message": "🎉 Congratulazioni! Hai superato!",
  "data": {
    "score": 86.0,
    "passed": true,
    "correctAnswers": 43,
    "totalQuestions": 50,
    "passingScore": 80
  }
}
```

### 6.4 Assessment Endpoints

**POST /api/assessments**

Request:
```json
{
  "organizationId": 123,
  "templateId": 1
}
```

Response (201):
```json
{
  "success": true,
  "data": {
    "id": 999,
    "organization_id": 123,
    "template_id": 1,
    "status": "draft",
    "responses": {},
    "completion_percentage": 0,
    "created_at": "2025-01-15T10:00:00Z"
  }
}
```

**PATCH /api/assessments/:id**

Request:
```json
{
  "responses": {
    "q1": "La nostra organizzazione dispone di...",
    "q2": "Il CISO è designato con atto formale..."
  },
  "completion_percentage": 45
}
```

Response (200):
```json
{
  "success": true,
  "message": "Assessment aggiornato",
  "data": {
    "id": 999,
    "completion_percentage": 45,
    "updated_at": "2025-01-15T11:30:00Z"
  }
}
```

**PATCH /api/assessments/:id/status**

Request:
```json
{
  "status": "submitted"
}
```

Response (200):
```json
{
  "success": true,
  "message": "Assessment inviato per revisione",
  "data": {
    "oldStatus": "in_progress",
    "newStatus": "submitted",
    "submitted_at": "2025-01-15T12:00:00Z"
  }
}
```

**POST /api/assessments/:id/assign-token**

Response (200):
```json
{
  "success": true,
  "data": {
    "token": "ACC-1705320000-A3F2B8C1",
    "expiresAt": "2025-01-18T12:00:00Z"
  }
}
```

**POST /api/assessments/accept/:token**

Response (200):
```json
{
  "success": true,
  "message": "Assessment accettato",
  "data": {
    "assessmentId": 999
  }
}
```

### 6.5 Evidence Endpoints

**POST /api/evidence**

Headers:
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Request (FormData):
```
file: <binary>
assessmentId: 999
organizationId: 123
questionId: q5
description: "Policy sicurezza informatica"
```

Response (201):
```json
{
  "success": true,
  "message": "File caricato",
  "data": {
    "id": 5555,
    "file_name": "policy_sicurezza.pdf",
    "file_size_bytes": 1048576,
    "file_hash": "a3f2b8c1...",
    "storage_path": "assessments/999/1705320000-abc123.pdf",
    "uploaded_at": "2025-01-15T13:00:00Z"
  }
}
```

**GET /api/evidence/:id/download**

Response (200):
```json
{
  "success": true,
  "data": {
    "url": "https://r2.cloudflarestorage.com/...?X-Amz-Signature=...",
    "expiresIn": 3600,
    "fileName": "policy_sicurezza.pdf",
    "fileSize": 1048576
  }
}
```

**GET /api/evidence/assessment/:assessmentId**

Response (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 5555,
      "file_name": "policy_sicurezza.pdf",
      "question_id": "q5",
      "uploaded_by_name": "Mario Rossi",
      "uploaded_at": "2025-01-15T13:00:00Z"
    }
  ]
}
```

---

## 7. Frontend Architecture

### 7.1 Module Pattern (Vanilla JS)

**File Structure**:

```
public/
├── pages/
│   ├── ente/
│   │   └── dashboard.html
│   ├── specialist/
│   │   └── dashboard.html
│   └── admin/
│       └── index.html
└── js/
    ├── modules/
    │   ├── ente-dashboard.js
    │   ├── specialist-dashboard.js
    │   └── admin-panel.js
    └── utils/
        ├── api.js
        └── helpers.js
```

**API Client Pattern** (`js/utils/api.js`):

```javascript
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : '/api';

export class ApiClient {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/auth.html';
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }
}

export const api = new ApiClient();
```

**State Management** (Simple Pub/Sub):

```javascript
class EventBus {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(cb => cb(data));
    }
  }
}

export const bus = new EventBus();

// Usage
bus.on('assessment:updated', (assessment) => {
  updateUI(assessment);
});

bus.emit('assessment:updated', newAssessment);
```

### 7.2 Component Pattern

```javascript
// Component base class
class Component {
  constructor(container) {
    this.container = container;
    this.state = {};
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.render();
  }

  render() {
    // Override in subclass
  }
}

// Example component
class AssessmentProgress extends Component {
  constructor(container) {
    super(container);
    this.state = {
      completed: 0,
      total: 50
    };
  }

  render() {
    const percentage = (this.state.completed / this.state.total) * 100;

    this.container.innerHTML = `
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${percentage}%"></div>
      </div>
      <p>${this.state.completed}/${this.state.total} completate</p>
    `;
  }
}
```

---

## 8. Estensibilità e Personalizzazione

### 8.1 Aggiungere un Nuovo Modulo

**Step 1**: Crea struttura

```bash
mkdir -p modules/my-module/{services,controllers,routes,middleware}
```

**Step 2**: Crea servizio (`modules/my-module/services/myService.js`)

```javascript
import { pool } from '../../../core/database/connection.js';
import { auditLog } from '../../audit/services/auditService.js';
import logger from '../../../core/utils/logger.js';

export const myFunction = async (data, userId) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Your logic here
    const result = await client.query('...');

    await client.query('COMMIT');

    await auditLog({
      userId,
      action: 'MY_ACTION',
      entityType: 'my_entity',
      entityId: result.rows[0].id,
      newValue: result.rows[0]
    });

    return result.rows[0];

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error in myFunction:', error);
    throw error;
  } finally {
    client.release();
  }
};
```

**Step 3**: Controller

```javascript
import { myFunction } from '../services/myService.js';

export const myHandler = async (req, res) => {
  try {
    const result = await myFunction(req.body, req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

**Step 4**: Routes

```javascript
import express from 'express';
import { authenticate } from '../../../server/middleware/auth.js';
import { myHandler } from '../controllers/myController.js';

const router = express.Router();

router.post('/', authenticate, myHandler);

export default router;
```

**Step 5**: Register in main app (`server/index.js`)

```javascript
import myRoutes from '../modules/my-module/routes/myRoutes.js';

app.use('/api/my-module', myRoutes);
```

### 8.2 Estendere Database

**Create Migration** (`core/database/migrations/002_my_feature.js`):

```javascript
import { pool } from '../connection.js';
import logger from '../../utils/logger.js';

export const up = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE my_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query('COMMIT');
    logger.success('✅ Migration 002 completed');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('❌ Migration 002 failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const down = async () => {
  await pool.query('DROP TABLE IF EXISTS my_table CASCADE');
};
```

**Run Migration**:

```bash
npm run migrate
```

### 8.3 Custom Assessment Template

**Create Template**:

```javascript
// POST /api/assessment-templates
{
  "version": "2.0",
  "name": "Framework NIS2 Compliance",
  "description": "Assessment per NIS2 Directive",
  "structure": {
    "sections": [
      {
        "id": "nis2_risk",
        "title": "Risk Management NIS2",
        "weight": 30,
        "questions": [
          {
            "id": "nis2_q1",
            "type": "textarea",
            "required": true,
            "evidenceRequired": true,
            "question": "Descrivere il processo di risk assessment secondo NIS2",
            "hints": [
              "Include riferimenti agli asset critici",
              "Descrivere la metodologia utilizzata"
            ]
          }
        ]
      }
    ]
  }
}
```

**Activate Template**:

```javascript
// PATCH /api/assessment-templates/:id/activate
// Only one template can be active at a time
```

---

## 9. Performance e Scalabilità

### 9.1 Database Optimization

**Connection Pooling**:

```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Max concurrent connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});
```

**Query Optimization**:

```sql
-- Add indices for frequent queries
CREATE INDEX idx_assessments_org_status ON assessments(organization_id, status);

-- Use EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT * FROM assessments
WHERE organization_id = 123 AND status = 'approved';
```

**JSONB Performance**:

```sql
-- GIN index for JSONB columns
CREATE INDEX idx_assessments_responses ON assessments USING GIN (responses);

-- Faster queries
SELECT * FROM assessments
WHERE responses @> '{"q1": "ISO 27001"}';
```

### 9.2 Caching Strategy

**Redis Integration** (future):

```javascript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache assessment templates
export const getActiveTemplate = async () => {
  const cached = await redis.get('template:active');

  if (cached) {
    return JSON.parse(cached);
  }

  const template = await pool.query('SELECT * FROM assessment_templates WHERE active = true');

  await redis.setex('template:active', 3600, JSON.stringify(template.rows[0]));

  return template.rows[0];
};
```

### 9.3 File Upload Optimization

**Streaming Large Files**:

```javascript
import { pipeline } from 'stream/promises';
import { createReadStream } from 'fs';

// Stream upload to S3
const fileStream = createReadStream(filePath);

await s3Client.send(new PutObjectCommand({
  Bucket: BUCKET,
  Key: key,
  Body: fileStream
}));
```

**Multipart Upload** (files > 100MB):

```javascript
import { Upload } from '@aws-sdk/lib-storage';

const upload = new Upload({
  client: s3Client,
  params: {
    Bucket: BUCKET,
    Key: key,
    Body: fileStream
  },
  queueSize: 4,
  partSize: 5 * 1024 * 1024 // 5MB parts
});

await upload.done();
```

### 9.4 Horizontal Scaling

**Stateless API** (ready for load balancing):

- No server-side sessions (JWT in localStorage)
- All state in database
- File uploads go directly to S3/R2

**Load Balancer Setup** (Nginx):

```nginx
upstream backend {
  server backend1.example.com:3000;
  server backend2.example.com:3000;
  server backend3.example.com:3000;
}

server {
  listen 80;

  location /api {
    proxy_pass http://backend;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

---

## 10. Troubleshooting Avanzato

### 10.1 Common Issues

**Issue: "Database connection failed"**

Diagnosis:
```bash
# Test connection
psql $DATABASE_URL

# Check pool stats
SELECT * FROM pg_stat_activity WHERE datname = 'certicredia';
```

Solutions:
- Verify `DATABASE_URL` in `.env`
- Check Neon database is not paused
- Increase pool size if connections exhausted
- Check SSL mode (`?sslmode=require`)

**Issue: "JWT token invalid"**

Diagnosis:
```javascript
// Decode token without verification
const decoded = jwt.decode(token);
console.log('Token expired at:', new Date(decoded.exp * 1000));
```

Solutions:
- Check `JWT_SECRET` matches between environments
- Verify token not expired
- Clear localStorage and re-login
- Check `JWT_EXPIRES_IN` setting

**Issue: "MFA code not working"**

Diagnosis:
```bash
# Check server time sync
date -u

# Compare with:
date +%s
```

Solutions:
- Ensure server clock is synchronized (NTP)
- speakeasy uses ±60s window (configurable)
- Use backup codes if TOTP fails
- Regenerate secret if persistent issues

**Issue: "File upload fails with 403"**

Diagnosis:
```bash
# Test S3/R2 credentials
aws s3 ls s3://certicredia-evidence --endpoint-url=$STORAGE_ENDPOINT
```

Solutions:
- Verify `STORAGE_ACCESS_KEY` and `STORAGE_SECRET_KEY`
- Check bucket permissions (must allow PutObject)
- Verify `STORAGE_ENDPOINT` URL
- Check CORS settings on bucket

### 10.2 Performance Debugging

**Slow Queries**:

```sql
-- Enable query logging
ALTER DATABASE certicredia SET log_min_duration_statement = 1000; -- Log queries > 1s

-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Memory Leaks**:

```javascript
// Monitor Node.js memory
setInterval(() => {
  const used = process.memoryUsage();
  console.log({
    rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`
  });
}, 60000);
```

**Database Locks**:

```sql
-- Show blocking queries
SELECT blocked_locks.pid AS blocked_pid,
       blocking_locks.pid AS blocking_pid,
       blocked_activity.query AS blocked_statement,
       blocking_activity.query AS blocking_statement
FROM pg_locks blocked_locks
JOIN pg_stat_activity blocked_activity ON blocked_locks.pid = blocked_activity.pid
JOIN pg_locks blocking_locks ON blocked_locks.locktype = blocking_locks.locktype
JOIN pg_stat_activity blocking_activity ON blocking_locks.pid = blocking_activity.pid
WHERE NOT blocked_locks.granted;
```

### 10.3 Monitoring Setup

**Health Endpoint**:

```javascript
app.get('/api/health', async (req, res) => {
  try {
    // Test DB connection
    await pool.query('SELECT 1');

    // Test S3 connection
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET }));

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      storage: 'connected',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      error: error.message
    });
  }
});
```

**Metrics Endpoint** (for Prometheus/Grafana):

```javascript
let requestCount = 0;
let errorCount = 0;

app.use((req, res, next) => {
  requestCount++;

  res.on('finish', () => {
    if (res.statusCode >= 500) {
      errorCount++;
    }
  });

  next();
});

app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(`
    # HELP requests_total Total HTTP requests
    # TYPE requests_total counter
    requests_total ${requestCount}

    # HELP errors_total Total HTTP errors (5xx)
    # TYPE errors_total counter
    errors_total ${errorCount}
  `);
});
```

---

## Conclusioni

Questa architettura fornisce:

✅ **Modularità** - Facile manutenzione e estensione
✅ **Sicurezza** - Enterprise-grade con MFA, audit, RBAC
✅ **Scalabilità** - Stateless API, database ottimizzato
✅ **Compliance** - Audit trail indelebile per PA/Enti
✅ **Flessibilità** - JSONB per assessment strutture variabili
✅ **Performance** - Indici, pooling, caching ready

**Prossimi Step Consigliati**:

1. Implementare caching con Redis
2. Aggiungere test suite (Jest/Mocha)
3. Setup monitoring (Sentry + LogTail)
4. Implementare backup automatici
5. CI/CD pipeline (GitHub Actions)

---

**Documento aggiornato**: 2025-01-15
**Versione**: 2.0
**Autore**: CertiCredia Development Team
