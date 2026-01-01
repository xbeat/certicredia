#!/bin/bash

# ============================================================================
# MASTER RESET - Script completo per reset totale database CertiCredia
# ============================================================================
# ATTENZIONE: Questo script ELIMINA TUTTO il database e lo ricrea da zero!
#
# Cosa fa:
# 1. DROP completo dello schema public (tutte le tabelle, funzioni, trigger)
# 2. Ricrea schema public pulito
# 3. Crea tutte le tabelle dal file SQL
# 4. Popola con dati demo completi (utenti, org, prodotti, ordini, ecc.)
# 5. Genera assessment CPF per tutte le organizzazioni
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load DATABASE_URL from .env
if [ -z "$DATABASE_URL" ] && [ -f "$PROJECT_ROOT/.env" ]; then
  export DATABASE_URL=$(grep -E "^DATABASE_URL=" "$PROJECT_ROOT/.env" | cut -d '=' -f 2- | tr -d '"' | tr -d "'")
fi

# ============================================================================
# HEADER
# ============================================================================
echo ""
echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║                                                                ║${NC}"
echo -e "${RED}║            🔥 MASTER DATABASE RESET 🔥                         ║${NC}"
echo -e "${RED}║                                                                ║${NC}"
echo -e "${RED}║   ATTENZIONE: QUESTO SCRIPT ELIMINERÀ TUTTI I DATI!           ║${NC}"
echo -e "${RED}║                                                                ║${NC}"
echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Verify DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ ERRORE: DATABASE_URL non definito!${NC}"
  echo ""
  echo "Aggiungi DATABASE_URL al file .env:"
  echo ""
  echo "Locale:"
  echo "  DATABASE_URL=postgresql://user:password@localhost:5432/certicredia"
  echo ""
  exit 1
fi

# Show database info (masked)
DB_MASKED="${DATABASE_URL%%@*}@***"
echo -e "${BLUE}📋 Database: ${DB_MASKED}${NC}"
echo ""

# ============================================================================
# TRIPLE CONFIRMATION (for safety)
# ============================================================================
echo -e "${YELLOW}⚠️  CONFERMA 1/3: Questo eliminerà TUTTE le tabelle, dati, funzioni, trigger...${NC}"
echo -e "${YELLOW}Sei SICURO di voler continuare?${NC}"
echo -n "Digita 'SI' per continuare: "
read CONFIRM1

if [ "$CONFIRM1" != "SI" ]; then
  echo -e "${GREEN}✓ Operazione annullata${NC}"
  exit 0
fi

echo ""
echo -e "${YELLOW}⚠️  CONFERMA 2/3: Tutti i dati esistenti saranno PERSI PERMANENTEMENTE${NC}"
echo -n "Digita 'ELIMINA TUTTO' per continuare: "
read CONFIRM2

if [ "$CONFIRM2" != "ELIMINA TUTTO" ]; then
  echo -e "${GREEN}✓ Operazione annullata${NC}"
  exit 0
fi

echo ""
echo -e "${RED}⚠️  CONFERMA 3/3: ULTIMA POSSIBILITÀ DI ANNULLARE!${NC}"
echo -n "Digita il nome del database 'certicredia' per confermare: "
read CONFIRM3

if [ "$CONFIRM3" != "certicredia" ]; then
  echo -e "${GREEN}✓ Operazione annullata${NC}"
  exit 0
fi

echo ""
echo -e "${RED}🔥 INIZIO RESET TOTALE...${NC}"
echo ""
sleep 2

# ============================================================================
# STEP 1: DROP COMPLETO DELLO SCHEMA PUBLIC
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 1: Eliminazione completa schema public${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

psql "$DATABASE_URL" << 'EOF'
-- Drop everything in public schema
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Grant permissions
GRANT ALL ON SCHEMA public TO PUBLIC;
GRANT ALL ON SCHEMA public TO certicredia_user;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EOF

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Errore durante il drop dello schema!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Schema public eliminato e ricreato${NC}"
echo ""

# ============================================================================
# STEP 2: CREAZIONE SCHEMA DA SQL
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 2: Creazione tabelle da schema SQL${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "$PROJECT_ROOT"

if [ ! -f "core/database/schema/complete_schema.sql" ]; then
    echo -e "${RED}❌ ERRORE: File schema SQL non trovato!${NC}"
    exit 1
fi

psql "$DATABASE_URL" < core/database/schema/complete_schema.sql

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Errore durante la creazione dello schema!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Tabelle create con successo${NC}"
echo ""

# ============================================================================
# STEP 3: SEED DATI DEMO
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 3: Popolamento dati demo${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ ! -f "scripts/seedEnhancedDemoData.js" ]; then
    echo -e "${RED}❌ ERRORE: Script seed non trovato!${NC}"
    exit 1
fi

node scripts/seedEnhancedDemoData.js

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Errore durante il seed dei dati demo!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dati demo popolati${NC}"
echo ""

# ============================================================================
# STEP 4: GENERAZIONE ASSESSMENT CPF
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 4: Generazione assessment CPF${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ ! -f "scripts/seed-perfect-cpf-data.js" ]; then
    echo -e "${YELLOW}⚠️  Script CPF non trovato, skip...${NC}"
else
    node scripts/seed-perfect-cpf-data.js

    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Errore durante la generazione CPF!${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Assessment CPF generati${NC}"
fi

echo ""

# ============================================================================
# STEP 5: VERIFICA FINALE
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 5: Verifica database${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

psql "$DATABASE_URL" << 'EOF'
-- Count records
SELECT
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'organizations', COUNT(*) FROM organizations
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'cpf_auditing_assessments', COUNT(*) FROM cpf_auditing_assessments
ORDER BY table_name;
EOF

echo ""

# ============================================================================
# SUCCESS
# ============================================================================
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                                ║${NC}"
echo -e "${GREEN}║              ✅ RESET COMPLETATO CON SUCCESSO! ✅              ║${NC}"
echo -e "${GREEN}║                                                                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📝 Credenziali di accesso:${NC}"
echo ""
echo -e "  ${RED}🔴 ADMIN:${NC}       admin@certicredia.test / Admin123!@#"
echo -e "  ${BLUE}🏢 ORGANIZATION:${NC} organization@certicredia.test / Org123!@#"
echo -e "  ${GREEN}🛒 USER:${NC}        user@certicredia.test / User123!@#"
echo -e "  ${YELLOW}🎓 SPECIALIST:${NC}   specialist@certicredia.test / Specialist123!@#"
echo ""
echo -e "${BLUE}🚀 Prossimi passi:${NC}"
echo "  1. npm start"
echo "  2. Accedi con uno degli account sopra"
echo "  3. Testa la dashboard auditing"
echo ""
