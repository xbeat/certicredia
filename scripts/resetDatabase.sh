#!/bin/bash

# Script per pulire completamente il database e ricreare i dati demo
# Uso: ./scripts/resetDatabase.sh

echo "========================================="
echo "RESET DATABASE CERTICREDIA"
echo "========================================="
echo ""
echo "ATTENZIONE: Questo eliminerà TUTTI i dati dal database!"
echo "Premi CTRL+C per annullare, INVIO per continuare..."
read

echo ""
echo "1. Connessione al database e pulizia tabelle..."

# Drop e ricrea tutte le tabelle
psql -U postgres -d certicredia << EOF
-- Drop tutte le tabelle (cascade per eliminare anche le foreign keys)
DROP TABLE IF EXISTS assessment_answers CASCADE;
DROP TABLE IF EXISTS assessment_responses CASCADE;
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS specialist_certifications CASCADE;
DROP TABLE IF EXISTS specialist_cpe_logs CASCADE;
DROP TABLE IF EXISTS specialist_organizations CASCADE;
DROP TABLE IF EXISTS specialists CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS contact_submissions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;

-- Ricrea schema base (sarà fatto dalla migrazione)
COMMIT;
EOF

if [ $? -ne 0 ]; then
    echo "❌ Errore durante la pulizia del database!"
    exit 1
fi

echo "✅ Database pulito!"
echo ""

echo "2. Esecuzione migrazioni (ricrea tabelle)..."
cd /home/user/certicredia
node server/migrate.js

if [ $? -ne 0 ]; then
    echo "❌ Errore durante le migrazioni!"
    exit 1
fi

echo "✅ Migrazioni completate!"
echo ""

echo "3. Creazione dati demo..."
node scripts/seedEnhancedDemoData.js

if [ $? -ne 0 ]; then
    echo "❌ Errore durante il seed dei dati demo!"
    exit 1
fi

echo ""
echo "========================================="
echo "✅ DATABASE RESET COMPLETATO!"
echo "========================================="
echo ""
echo "Credenziali di accesso:"
echo "- Admin: admin@certicredia.test / Admin123!@#"
echo "- Ente: ente@certicredia.test / Ente123!@#"
echo "- Specialist: specialist@certicredia.test / Specialist123!@#"
echo ""
echo "Puoi ora avviare il server con: cd server && node index.js"
echo ""
