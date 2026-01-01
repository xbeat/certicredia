#!/bin/bash

# Script per pulire completamente il database e ricreare i dati demo
# Uso: ./scripts/resetDatabase.sh
#
# IMPORTANTE: Definisci DATABASE_URL nel file .env
# Esempio locale: DATABASE_URL=postgresql://user:password@localhost:5432/certicredia
# Esempio Neon:   DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Carica DATABASE_URL da .env usando grep (più sicuro di source)
# MA solo se non è già definito (es. passato nel comando)
if [ -z "$DATABASE_URL" ] && [ -f "$PROJECT_ROOT/.env" ]; then
  export DATABASE_URL=$(grep -E "^DATABASE_URL=" "$PROJECT_ROOT/.env" | cut -d '=' -f 2- | tr -d '"' | tr -d "'")
fi

echo "========================================="
echo "RESET DATABASE CERTICREDIA"
echo "========================================="
echo ""

# Verifica che DATABASE_URL sia definito
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERRORE: DATABASE_URL non definito!"
  echo ""
  echo "Aggiungi DATABASE_URL al file .env:"
  echo ""
  echo "Locale:"
  echo "  DATABASE_URL=postgresql://user:password@localhost:5432/certicredia"
  echo ""
  echo "Neon:"
  echo "  DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require"
  echo ""
  exit 1
fi

echo "📋 Database: ${DATABASE_URL%%@*}@***"
echo ""
echo "ATTENZIONE: Questo eliminerà TUTTI i dati dal database!"
echo "Premi CTRL+C per annullare, INVIO per continuare..."
read

echo ""
echo "1. Connessione al database e pulizia tabelle..."

DB_CONNECTION="$DATABASE_URL"

# Drop e ricrea tutte le tabelle
psql "$DB_CONNECTION" << EOF
-- Drop tutte le tabelle (cascade per eliminare anche le foreign keys)
DROP TABLE IF EXISTS cpf_auditing_assessments CASCADE;
DROP TABLE IF EXISTS assessment_answers CASCADE;
DROP TABLE IF EXISTS assessment_responses CASCADE;
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS specialist_certifications CASCADE;
DROP TABLE IF EXISTS specialist_cpe_logs CASCADE;
DROP TABLE IF EXISTS specialist_organizations CASCADE;
DROP TABLE IF EXISTS specialists CASCADE;
DROP TABLE IF EXISTS organization_users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS contact_submissions CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS user_certifications CASCADE;
DROP TABLE IF EXISTS cart CASCADE;

-- Ricrea schema base (sarà fatto dalla migrazione)
COMMIT;
EOF

if [ $? -ne 0 ]; then
    echo "❌ Errore durante la pulizia del database!"
    exit 1
fi

echo "✅ Database pulito!"
echo ""

echo "2. Creazione tabelle da schema SQL..."
cd "$PROJECT_ROOT"
psql "$DB_CONNECTION" < core/database/schema/complete_schema.sql

if [ $? -ne 0 ]; then
    echo "❌ Errore durante le migrazioni!"
    exit 1
fi

echo "✅ Migrazioni completate!"
echo ""

echo "3. Creazione dati demo (users, organizations, specialists)..."
node scripts/seedEnhancedDemoData.js

if [ $? -ne 0 ]; then
    echo "❌ Errore durante il seed dei dati demo!"
    exit 1
fi

echo "✅ Dati demo creati!"
echo ""

echo "4. Generazione dati CPF Auditing per tutte le organizzazioni..."
node scripts/seed-perfect-cpf-data.js

if [ $? -ne 0 ]; then
    echo "❌ Errore durante la generazione dei dati CPF Auditing!"
    exit 1
fi

echo ""
echo "========================================="
echo "✅ DATABASE RESET COMPLETATO!"
echo "========================================="
echo ""
echo "Credenziali di accesso:"
echo "🔴 SUPER ADMIN:     admin@certicredia.test / Admin123!@#"
echo "🛒 ECOMMERCE USER:  user@certicredia.test / User123!@#"
echo "🏢 ORGANIZATION:    organization@certicredia.test / Org123!@#"
echo "🎓 SPECIALIST:      specialist@certicredia.test / Specialist123!@#"
echo ""
echo "Puoi ora avviare il server con: npm start"
echo ""
