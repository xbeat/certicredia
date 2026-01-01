#!/bin/bash

# Script per fixare specialist profiles tramite API
# Assicurati che il server sia in esecuzione prima di eseguire!

echo "🔧 Fix Specialist Profiles tramite API"
echo "========================================"
echo ""

# Determina l'URL del server
if [ -z "$SERVER_URL" ]; then
    SERVER_URL="http://localhost:3000"
fi

echo "📡 Chiamata a: ${SERVER_URL}/api/specialists/fix-profiles"
echo ""

# Esegui il fix
response=$(curl -s -X POST \
  "${SERVER_URL}/api/specialists/fix-profiles" \
  -H "Content-Type: application/json")

# Mostra la risposta
echo "📋 Risposta:"
echo "$response" | jq '.' 2>/dev/null || echo "$response"

echo ""
echo "✅ Fatto!"
echo ""
echo "⚠️  IMPORTANTE: Dopo il fix, rimuovi l'endpoint temporaneo:"
echo "   1. Rimuovi l'import in modules/specialists/routes/specialistRoutes.js"
echo "   2. Elimina il file modules/specialists/routes/fixSpecialistProfiles.js"
