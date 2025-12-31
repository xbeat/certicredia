# 📊 Database Population Scripts

## Setup & Schema Scripts

### 1. Main Database Setup
```bash
# Setup principale database + tabelle organizzazioni, utenti, etc.
node scripts/setup-database.js
```

### 2. CPF Auditing Setup
```bash
# Setup tabelle CPF auditing (cpf_auditing_assessments)
DATABASE_URL='...' node scripts/setup-cpf-auditing-db.js
```

### 3. Accreditation Schema
```bash
# Setup tabelle accreditamento
node scripts/runAccreditationSchema.js
```

## Data Population Scripts

### 4. Demo Users
```bash
# Crea utenti demo (admin, specialist, organization_admin)
node scripts/seedDemoUsers.js
```

### 5. Simple Demo Data
```bash
# Dati demo semplici (organizzazioni base)
node scripts/seedSimpleDemo.js
```

### 6. Enhanced Demo Data
```bash
# Dati demo completi (organizzazioni + dettagli)
node scripts/seedEnhancedDemoData.js
```

### 7. Specialist Assignments
```bash
# Assegna specialist alle organizzazioni
node scripts/seedSpecialistAssignments.js
```

### 8. Orders
```bash
# Crea ordini demo per testing e-commerce
node scripts/seedOrders.js
```

### 9. CPF Auditing Assessments
```bash
# Opzione A: Seed manuale (crea solo se non esiste)
DATABASE_URL='...' node scripts/seed-cpf-auditing.js

# Opzione B: Auto-generazione per TUTTE le org
DATABASE_URL='...' node scripts/generate-all-cpf-data.js
```

## 🚀 Setup Completo da Zero

```bash
# 1. Setup database principale
node scripts/setup-database.js

# 2. Setup CPF auditing
DATABASE_URL='...' node scripts/setup-cpf-auditing-db.js

# 3. Popola utenti demo
node scripts/seedDemoUsers.js

# 4. Popola organizzazioni
node scripts/seedEnhancedDemoData.js

# 5. Genera dati CPF per tutte le org
DATABASE_URL='...' node scripts/generate-all-cpf-data.js

# 6. (Opzionale) Specialist assignments
node scripts/seedSpecialistAssignments.js

# 7. (Opzionale) Ordini demo
node scripts/seedOrders.js
```

## Database Utilities

### Reset Database
```bash
# ATTENZIONE: Elimina TUTTI i dati!
./reset-db.sh
```

### Migrations
```bash
# Esegui migration specifiche
node scripts/runMigration.js
node scripts/migrateDatabase.js
```

### Verify
```bash
# Verifica moduli e struttura
node scripts/verifyModules.js
```

### Reset Accreditation Tables
```bash
# Reset solo tabelle accreditamento
node scripts/resetAccreditationTables.js
```

### Init Database
```bash
# Inizializzazione database
node scripts/initDatabase.js
```

## 📝 Note

- **DATABASE_URL**: Usa per Neon/cloud databases
- **Local DB**: Usa variabili .env (DB_HOST, DB_PORT, etc.)
- Scripts sono idempotenti: safe da ri-eseguire
- Ordine consigliato: setup → users → orgs → data
