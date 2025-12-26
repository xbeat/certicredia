# CertiCredia - Piattaforma Backend Accreditamento Cybersecurity

**Versione 2.0** - Backend completo per gestione accreditamenti cybersecurity, Enti e Specialist.

## 📋 Indice

- [Panoramica](#panoramica)
- [Stack Tecnologico](#stack-tecnologico)
- [Architettura](#architettura)
- [Installazione](#installazione)
- [Configurazione](#configurazione)
- [Database Setup](#database-setup)
- [Avvio Applicazione](#avvio-applicazione)
- [API Endpoints](#api-endpoints)
- [Moduli](#moduli)
- [Sicurezza](#sicurezza)
- [Deployment](#deployment)
- [Manutenzione](#manutenzione)

---

## 🎯 Panoramica

Piattaforma backend professionale per gestire:

- **Organizzazioni** (Enti Pubblici e Aziende Private)
- **Specialist** qualificati (con esami e CPE)
- **Assessment** di accreditamento cybersecurity
- **Workflow** completo di revisione e approvazione
- **Evidence storage** sicuro (S3/Cloudflare R2)
- **Report PDF** con certificati di accreditamento
- **Audit trail indelebile** per compliance

---

## 🛠️ Stack Tecnologico

### Backend
- **Node.js** 18+ (ES Modules)
- **Express.js** 4.18
- **PostgreSQL** (Neon serverless)

### Sicurezza
- **JWT** con MFA/TOTP (speakeasy)
- **bcrypt** (12 rounds)
- **Audit trail** indelebile
- **Password policy** configurabile

### Storage & Files
- **AWS S3** / **Cloudflare R2** (signed URLs)
- **multer** (file upload)
- **PDFKit** (generazione certificati)

### Email
- **Resend API** (3,000/month free tier)

### Automation
- **node-cron** (scheduled tasks)

---

## 🏗️ Architettura

### Struttura Modulare

```
/certicredia/
├── modules/                     # Business Logic Modules
│   ├── auth/                   # Autenticazione + MFA
│   ├── organizations/          # Gestione Enti
│   ├── specialists/            # Gestione Specialist
│   ├── assessments/            # Dashboard Accreditamento
│   ├── evidence/               # Storage File
│   ├── workflow/               # State Machine
│   ├── reports/                # PDF Generation
│   ├── shop/                   # E-commerce (esistente)
│   └── audit/                  # Audit Trail
├── core/                        # Core Framework
│   ├── database/               # Schema + Migrations
│   ├── config/                 # Configuration
│   ├── middleware/             # Shared Middleware
│   └── utils/                  # Utilities
├── public/                      # Frontend (Vanilla JS)
├── server/                      # Legacy code (da migrare)
└── tests/                       # Test Suite
```

### Database Schema (14 Tabelle)

- **users** - Utenti sistema
- **organizations** - Enti/Aziende
- **organization_users** - Relazione many-to-many
- **specialist_profiles** - Profili Specialist
- **specialist_exam_questions** - Banca domande esame
- **specialist_exam_attempts** - Tentativi esame
- **specialist_cpe_records** - Formazione continua
- **assessment_templates** - Framework versioned
- **assessments** - Istanze accreditamento
- **evidence_files** - Metadata file caricati
- **specialist_assignments** - Assegnazioni token-based
- **review_comments** - Commenti revisione
- **audit_logs** - Log indelebili
- **password_reset_tokens** - Reset password
- **mfa_secrets** - Segreti TOTP

---

## 📦 Installazione

### 1. Clone Repository

```bash
git clone <repository-url>
cd certicredia
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment

```bash
cp .env.example .env
```

Modifica `.env` con le tue configurazioni (vedi [Configurazione](#configurazione)).

---

## ⚙️ Configurazione

### Database (Neon PostgreSQL)

```env
DATABASE_URL=postgresql://user:password@your-neon-host.neon.tech/certicredia?sslmode=require
```

**Ottieni Neon Database:**
1. Vai su https://neon.tech
2. Crea nuovo progetto
3. Copia connection string
4. Incolla in `.env`

### Email (Resend)

```env
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=onboarding@resend.dev
NOTIFICATION_EMAIL=admin@certicredia.org
```

**Ottieni Resend API Key:**
1. Vai su https://resend.com
2. Registrati (3,000 email/month gratis)
3. Crea API key
4. Incolla in `.env`

### Storage (Cloudflare R2)

```env
STORAGE_PROVIDER=cloudflare
STORAGE_BUCKET=certicredia-evidence
STORAGE_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY=your_access_key
STORAGE_SECRET_KEY=your_secret_key
```

**Setup Cloudflare R2:**
1. Dashboard Cloudflare → R2
2. Crea bucket "certicredia-evidence"
3. Crea API token (R2 Read & Write)
4. Copia credenziali in `.env`

### Sicurezza

```env
# JWT
JWT_SECRET=cambia-questo-segreto-con-almeno-32-caratteri-casuali

# Password Policy
PASSWORD_MIN_LENGTH=12
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SPECIAL=true

# MFA (obbligatorio per admin e specialist)
MFA_REQUIRED_ROLES=admin,specialist
```

---

## 🗄️ Database Setup

### 1. Esegui Migrazioni

```bash
npm run migrate
```

Questo crea tutte le 14 tabelle + indici + trigger.

### 2. Verifica Status

```bash
npm run migrate:status
```

Output atteso:
```
✅ 001_accreditation_system (2025-01-15 10:30:00)
```

### 3. (Opzionale) Seed Dati

```bash
npm run seed
```

Crea 8 prodotti di esempio per lo shop.

---

## 🚀 Avvio Applicazione

### Development Mode (con auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

Il server parte su **http://localhost:3000** (o porta configurata in `PORT`).

### Verifica Health

```bash
curl http://localhost:3000/api/health
```

Output atteso:
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "database": "connected"
}
```

---

## 🌐 Testing da Browser

### 1. Avvia il Server

Assicurati che il server sia in esecuzione:

```bash
npm run dev
```

### 2. Struttura Accessi

Il sistema ha **2 entry point separati**:

#### A) Landing Page Marketing
- **URL**: `http://localhost:3000/`
- **File**: `/index.html`
- **Scopo**: Presentazione pubblica di CertiCredia
- **Funzionalità**: Info per prospect, specialist e aziende interessate
- **Link**: Bottone "Area Gestionale" nel navbar → porta alla webapp

#### B) Webapp Gestionale
- **URL**: `http://localhost:3000/public/app.html`
- **File**: `/public/app.html`
- **Scopo**: Entry point per utenti autenticati
- **Funzionalità**: Access rapido a Login, Registrazione e Dashboard

### 3. Pagine Disponibili

#### Homepage Gestionale (Entry Point Webapp)
- **URL**: `http://localhost:3000/public/app.html`
- **Descrizione**: Homepage dell'area gestionale con link a tutte le sezioni
- **Funzionalità**:
  - Health check automatico del sistema
  - Link rapidi a Login/Registrazione
  - Panoramica dashboard disponibili
  - Link al sito pubblico

#### Registrazione
- **URL**: `http://localhost:3000/public/pages/register.html`
- **Funzionalità**:
  - Crea nuovo account (Ente o Specialist Candidato)
  - Validazione password in tempo reale
  - Controllo forza password
  - Accettazione termini e condizioni

**Test rapido**:
```
Nome: Mario
Cognome: Rossi
Email: mario.rossi@test.com
Phone: +39 123 456 7890
Password: TestPassword123!@#
Tipologia: Ente/Organizzazione (Amministratore)
```

#### Login
- **URL**: `http://localhost:3000/public/pages/login.html`
- **Funzionalità**:
  - Login con email e password
  - Supporto MFA/TOTP (se abilitato per il ruolo)
  - Link recupero password
  - Redirect automatico al pannello corretto in base al ruolo

**Flusso MFA**:
1. Inserisci email e password
2. Se MFA richiesto, appare form per codice TOTP
3. Usa app autenticatore (Google Authenticator, Authy) per il codice
4. Reindirizzamento automatico

#### Recupero Password
- **URL**: `http://localhost:3000/public/pages/forgot-password.html`
- **Funzionalità**:
  - Richiesta reset password via email
  - Token valido 1 ora
  - Email con link di reset (via Resend API)

#### Dashboard Ente
- **URL**: `http://localhost:3000/public/pages/ente/dashboard.html`
- **Accesso**: Richiede login con ruolo `org_admin` o `org_operative`
- **Funzionalità**:
  - Visualizzazione organizzazione
  - Compilazione assessment (domande dinamiche)
  - Upload evidenze (documenti, screenshot)
  - Generazione token per assegnazione specialist
  - Tracking progresso (percentuale completamento)
  - Salvataggio bozza automatico
  - Invio per revisione

#### Pannello Specialist
- **URL**: `http://localhost:3000/public/pages/specialist/dashboard.html`
- **Accesso**: Richiede login con ruolo `specialist` o `candidate_specialist`
- **Funzionalità**:
  - Lista assessment assegnati
  - Accettazione incarichi via token
  - Revisione assessment con commenti
  - Registrazione ore CPE (formazione continua)
  - Statistiche personali (ore CPE, assessment completati)
  - Download evidenze

**Flusso Specialist**:
1. Login come specialist
2. Accetta incarico inserendo token ricevuto dall'Ente
3. Revisiona assessment
4. Aggiungi commenti e valutazioni
5. Approva/Richiedi modifiche/Rifiuta

#### Admin Panel
- **URL**: `http://localhost:3000/public/pages/admin/index.html`
- **Accesso**: Richiede login con ruolo `super_admin` o `admin`
- **Funzionalità**:
  - Dashboard overview con statistiche
  - Gestione organizzazioni (CRUD)
  - Gestione specialist (approvazione, sospensione)
  - Gestione template assessment
  - Visualizzazione audit logs
  - Gestione utenti sistema

### 4. Flusso Completo di Test

#### Test Scenario 1: Ente che completa un Assessment

```
1. Homepage Marketing
   - Vai su http://localhost:3000/
   - Clicca "Area Gestionale" nel navbar
   - Vieni reindirizzato a http://localhost:3000/public/app.html

2. Registrazione (public/pages/register.html)
   - Clicca "Registrazione"
   - Crea account come "Ente/Organizzazione (Amministratore)"
   - Email: ente@test.com
   - Password: TestPassword123!@#

3. Login (public/pages/login.html)
   - Accedi con le credenziali create
   - Verrai reindirizzato a /public/pages/ente/dashboard.html

4. Dashboard Ente (public/pages/ente/dashboard.html)
   - Crea nuova organizzazione (se non esiste)
   - Avvia nuovo assessment
   - Compila le domande del framework
   - Carica evidenze (file PDF, immagini)
   - Salva bozza (auto-save ogni 30 secondi)
   - Quando pronto, clicca "Invia per Revisione"

5. Genera Token Specialist
   - Nella dashboard, vai alla sezione "Specialist"
   - Clicca "Genera Token Assegnazione"
   - Copia il token (es. ACC-1234567890-ABCD)
   - Invia il token allo specialist (email, chat, etc.)
```

#### Test Scenario 2: Specialist che Revisiona

```
1. Registrazione (public/pages/register.html)
   - Da http://localhost:3000/public/app.html clicca "Registrazione"
   - Crea account come "Specialist (Candidato)"
   - Email: specialist@test.com
   - Password: TestPassword123!@#

2. Login (public/pages/login.html)
   - Accedi con le credenziali create
   - Verrai reindirizzato a /public/pages/specialist/dashboard.html

3. Dashboard Specialist (public/pages/specialist/dashboard.html)
   - Clicca "Accetta Incarico"
   - Inserisci il token ricevuto dall'Ente
   - L'assessment apparirà nella tua lista

4. Revisiona Assessment
   - Clicca sull'assessment assegnato
   - Leggi le risposte dell'Ente
   - Scarica le evidenze caricate
   - Aggiungi commenti alle domande
   - Seleziona severità (info, warning, critical)
   - Approva o richiedi modifiche

5. Registra CPE (Formazione)
   - Vai alla sezione CPE
   - Aggiungi ore di formazione
   - Carica certificati di partecipazione
```

#### Test Scenario 3: Admin che Gestisce il Sistema

```
1. Login come Admin
   - Vai su http://localhost:3000/public/pages/login.html
   - Usa credenziali admin (create manualmente via SQL o seed)
   - Verrai reindirizzato a /public/pages/admin/index.html

2. Admin Panel (public/pages/admin/index.html)
   - Visualizza statistiche: n° organizzazioni, specialist, assessment
   - Approva specialist candidati (dopo superamento esame)
   - Crea/modifica template assessment
   - Visualizza audit logs per compliance
   - Gestisci utenti (cambio ruoli, sospensione)
```

### 5. Testing API Diretti (Opzionale)

Se vuoi testare le API senza interfaccia:

#### Con cURL

```bash
# Health Check
curl http://localhost:3000/api/health

# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Mario",
    "last_name": "Rossi",
    "email": "mario@test.com",
    "password": "TestPassword123!@#",
    "role": "org_admin"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mario@test.com",
    "password": "TestPassword123!@#"
  }'
```

#### Con Postman/Insomnia

1. Importa collection da `/docs/postman_collection.json` (se disponibile)
2. Configura environment: `BASE_URL = http://localhost:3000/api`
3. Testa tutti gli endpoint con esempi pre-compilati

### 6. Troubleshooting Testing

**Problema**: Pagina bianca o errore 404

**Soluzione**:
- Verifica che il server sia in esecuzione (`npm run dev`)
- Controlla che l'URL sia corretto: `http://localhost:3000` (non `localhost:3001`)
- Guarda la console browser (F12) per errori JavaScript

**Problema**: Login non funziona

**Soluzione**:
- Verifica che il database sia configurato e le migrazioni eseguite
- Controlla che l'account esista (registrati prima)
- Verifica password policy rispettata (min 12 char, uppercase, lowercase, numbers, special)
- Guarda i log del server per errori

**Problema**: MFA richiesto ma non ho il QR code

**Soluzione**:
- Dopo la registrazione, vai a `/api/auth/mfa/setup` per ottenere il QR code
- Scansiona con Google Authenticator o Authy
- Salva i backup codes mostrati

**Problema**: Upload file non funziona

**Soluzione**:
- Verifica configurazione S3/Cloudflare R2 in `.env`
- Controlla credenziali `STORAGE_ACCESS_KEY` e `STORAGE_SECRET_KEY`
- Verifica che il bucket esista e abbia permessi corretti
- Limite dimensione file: 50MB (configurabile in `.env`)

---

## 📡 API Endpoints

### Auth & Security

```http
POST   /api/auth/register                 # Registrazione
POST   /api/auth/login                    # Login
POST   /api/auth/logout                   # Logout
GET    /api/auth/profile                  # Profilo utente
PUT    /api/auth/profile                  # Aggiorna profilo
PUT    /api/auth/password                 # Cambia password
POST   /api/auth/forgot-password          # Richiedi reset
POST   /api/auth/reset-password           # Reset con token
POST   /api/auth/mfa/setup                # Setup MFA
POST   /api/auth/mfa/verify               # Abilita MFA
POST   /api/auth/mfa/validate             # Valida TOTP
GET    /api/auth/mfa/status               # Status MFA
POST   /api/auth/mfa/disable              # Disabilita MFA
```

### Organizations

```http
POST   /api/organizations                 # Crea organizzazione
GET    /api/organizations                 # Lista (con filtri)
GET    /api/organizations/:id             # Dettagli
PUT    /api/organizations/:id             # Aggiorna
PATCH  /api/organizations/:id/status      # Cambia status
POST   /api/organizations/:id/users       # Aggiungi utente
GET    /api/organizations/:id/users       # Lista utenti
DELETE /api/organizations/:id/users/:uid  # Rimuovi utente
```

### Assessments (Workflow)

```http
POST   /api/assessments                   # Crea assessment
GET    /api/assessments/:id               # Dettagli
PATCH  /api/assessments/:id/status        # Cambia status
POST   /api/assessments/:id/assign-token  # Genera token specialist
POST   /api/assessments/accept/:token     # Accetta assignment
```

### Evidence Storage

```http
POST   /api/evidence                      # Upload file
GET    /api/evidence/:id/download         # Genera signed URL
GET    /api/evidence/assessment/:id       # Lista per assessment
DELETE /api/evidence/:id                  # Elimina file
```

### Reports

```http
POST   /api/reports/certificate/:assessmentId  # Genera PDF certificato
```

Vedi `docs/API.md` per documentazione completa con esempi.

---

## 📂 Moduli

### Auth Module
- Password recovery (email con token)
- MFA/TOTP con QR code
- Backup codes (10 single-use)
- Password policy enforcement

**Files:**
- `modules/auth/services/passwordService.js`
- `modules/auth/services/mfaService.js`
- `modules/auth/controllers/`
- `modules/auth/routes/`

### Organizations Module
- Multi-tenant con isolamento dati
- Tipologie: PA, Private, Non-profit
- Gestione utenti con ruoli
- Fatturazione separata

**Files:**
- `modules/organizations/services/organizationService.js`
- `modules/organizations/controllers/`
- `modules/organizations/routes/`

### Evidence Module
- Upload su S3/Cloudflare R2
- Signed URLs temporanei (1h default)
- Hash SHA256 per integrità
- Validazione tipo file

**Files:**
- `modules/evidence/services/storageService.js`

### Workflow Module
- State machine con transizioni validate
- Token assignment specialist
- Status: draft → in_progress → submitted → under_review → approved
- Scadenze automatiche (12 mesi)

**Files:**
- `modules/workflow/services/workflowService.js`

### Audit Module
- Log indelebili tutte le operazioni
- Masking campi sensibili
- Change tracking (old/new)
- Retention policy configurabile

**Files:**
- `modules/audit/services/auditService.js`
- `modules/audit/middleware/auditMiddleware.js`

---

## 🔒 Sicurezza

### Autenticazione
- JWT con refresh token
- MFA obbligatorio per admin/specialist
- Password hashing bcrypt (12 rounds)
- Password policy configurabile

### Multi-Tenancy
- Isolamento rigoroso via `organization_id`
- Check permessi su tutte le query
- Audit trail per tracciabilità

### File Storage
- Signed URLs temporanei
- No accesso pubblico diretto
- Validazione tipo file
- Limite dimensione (50MB default)

### Audit Trail
- Log indelebile ogni operazione critica
- IP address e user-agent
- Old/new values con diff
- Query API per investigazioni

### Rate Limiting
- 100 req/15min per IP (generale)
- 10 req/15min per endpoint auth

---

## 🚢 Deployment

### Render.com (Raccomandato)

1. **Push a GitHub**:
   ```bash
   git push origin main
   ```

2. **Crea Web Service su Render**:
   - Vai su https://render.com
   - New → Web Service
   - Collega repository GitHub
   - Build: `npm install`
   - Start: `npm start`

3. **Configura Environment Variables**:
   - Copia tutto da `.env`
   - Aggiungi su Render Dashboard → Environment

4. **Configura Database**:
   - Usa il Neon DATABASE_URL
   - Render eseguirà le migrazioni automaticamente

5. **Deploy**:
   - Render fa deploy automatico
   - Verifica su `https://your-app.onrender.com/api/health`

### Vercel / Railway / Heroku

Simile a Render, usa `package.json` scripts:
- Build: `npm install`
- Start: `npm start`

---

## 🔧 Manutenzione

### Cron Jobs (Automatici)

Se `CRON_ENABLED=true`:

- **Token cleanup**: Daily 2 AM - Pulisce token scaduti
- **CPE compliance**: Annually Jan 1st - Sospende specialist non conformi
- **Expiry notifications**: Daily 9 AM - Avvisa scadenze accreditamenti
- **Audit cleanup**: Daily 3 AM - Pulisce log vecchi (se retention policy)

### Backup Database

**Neon** ha backup automatici. Per backup manuale:

```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### Monitoring

Consigliati:
- **Sentry** (error tracking)
- **LogTail** (log aggregation)
- **Uptime Robot** (uptime monitoring)

### Update Dependencies

```bash
npm update
npm audit fix
```

---

## 📚 Documentazione Aggiuntiva

- `docs/API.md` - API Endpoints completa
- `docs/DATABASE.md` - Schema database dettagliato
- `docs/ARCHITECTURE.md` - Architettura e design
- `docs/DEPLOYMENT.md` - Guida deployment avanzata
- `modules/*/README.md` - Documentazione per ogni modulo

---

## 🐛 Troubleshooting

### Database connection error

**Errore**: `ECONNREFUSED` o `SSL required`

**Soluzione**:
1. Verifica `DATABASE_URL` in `.env`
2. Assicurati che Neon database sia attivo
3. Verifica `?sslmode=require` nell'URL

### Email non inviate

**Errore**: `Resend API error 403`

**Soluzione**:
1. Verifica `RESEND_API_KEY` valida
2. Usa `onboarding@resend.dev` per testing
3. Verifica dominio per email custom

### MFA QR Code non funziona

**Soluzione**:
1. Usa app autenticatore aggiornata (Google Authenticator, Authy)
2. Verifica orologio sistema sincronizzato
3. Usa i backup codes se necessario

### File upload error

**Errore**: `403 Forbidden` su S3/R2

**Soluzione**:
1. Verifica credenziali S3/R2 in `.env`
2. Controlla permessi bucket (Read & Write)
3. Verifica endpoint corretto

---

## 📄 Licenza

Proprietario - CertiCredia

---

## 👥 Supporto

- **Email**: request@certicredia.org
- **Issues**: GitHub Issues
- **Documentazione**: `/docs` folder

---

**Versione**: 2.0.0
**Ultimo aggiornamento**: 2025-01-15
**Node.js**: >= 18.0.0
**Database**: PostgreSQL 14+
