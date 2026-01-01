# 🔥 MASTER RESET - Guida Completa

## 📋 Panoramica

`MASTER_RESET.sh` è lo script DEFINITIVO per resettare completamente il database CertiCredia e ricrearlo da zero con dati demo completi.

## ⚠️ ATTENZIONE

Questo script **ELIMINA PERMANENTEMENTE** tutti i dati dal database!

**QUANDO USARLO:**
- ✅ Setup iniziale del progetto
- ✅ Reset completo per debugging
- ✅ Ricreare dati demo puliti
- ✅ Dopo modifiche allo schema SQL

**QUANDO NON USARLO:**
- ❌ Mai in produzione!
- ❌ Se hai dati importanti da preservare
- ❌ Se non sei sicuro

## 🚀 Come Usare

### Prerequisiti

1. **PostgreSQL avviato:**
   ```bash
   sudo service postgresql start
   ```

2. **File .env configurato:**
   ```env
   DATABASE_URL=postgresql://certicredia_user:certicredia123@localhost:5432/certicredia
   ```

3. **Permessi corretti sul database:**
   ```bash
   sudo -u postgres psql -d certicredia -c "ALTER SCHEMA public OWNER TO certicredia_user;"
   sudo -u postgres psql -d certicredia -c "GRANT ALL ON DATABASE certicredia TO certicredia_user;"
   ```

### Esecuzione

```bash
./scripts/MASTER_RESET.sh
```

Lo script ti chiederà **3 conferme** per sicurezza:

1. **CONFERMA 1/3:** Digita `SI`
2. **CONFERMA 2/3:** Digita `ELIMINA TUTTO`
3. **CONFERMA 3/3:** Digita `certicredia`

## 📦 Cosa Fa lo Script

### STEP 1: Drop Schema Public
Elimina COMPLETAMENTE lo schema public con tutte le:
- Tabelle
- Indici
- Funzioni
- Trigger
- Sequenze

### STEP 2: Creazione Tabelle
Ricrea tutte le tabelle da `core/database/schema/complete_schema.sql`:
- ✅ users
- ✅ organizations
- ✅ products
- ✅ orders & order_items
- ✅ contacts
- ✅ specialist_profiles
- ✅ assessments
- ✅ cpf_auditing_assessments
- ✅ ... e molte altre

### STEP 3: Seed Dati Demo
Esegue `scripts/seedEnhancedDemoData.js` che crea:
- **38 utenti** (admin, user, organization, specialist + 34 utenti vari)
- **21 organizzazioni** (aziende, enti pubblici, non-profit)
- **15 prodotti** (certificazioni e corsi)
- **50 ordini** (ordini demo con vari stati)
- **30 contatti** (richieste demo)
- **1 specialist profile** (con CPE records)
- **5 assessment templates**
- **30 assessments** (valutazioni in vari stati)
- **20 specialist assignments**
- **40 review comments**

### STEP 4: Generazione Assessment CPF
Esegue `scripts/seed-perfect-cpf-data.js` che genera:
- **21 CPF assessments** (uno per organizzazione)
- Dati realistici con 30-70% completamento
- Risk scores e maturity levels calcolati
- Confidence scores

### STEP 5: Verifica
Mostra un count di tutte le tabelle principali per verificare il successo.

## 🎯 Risultato Finale

```
✅ 38 utenti
✅ 21 organizzazioni
✅ 21 CPF assessments
✅ 15 prodotti
✅ 50 ordini
```

## 🔐 Credenziali di Accesso

Dopo il reset, puoi accedere con:

### Admin
- **Email:** admin@certicredia.test
- **Password:** Admin123!@#
- **Ruolo:** Super amministratore

### Organization Admin
- **Email:** organization@certicredia.test
- **Password:** Org123!@#
- **Ruolo:** Amministratore organizzazione
- **Organizzazione:** Organization Demo (ID: 1)

### User
- **Email:** user@certicredia.test
- **Password:** User123!@#
- **Ruolo:** Utente normale (e-commerce)

### Specialist
- **Email:** specialist@certicredia.test
- **Password:** Specialist123!@#
- **Ruolo:** Specialista certificato

## 🧪 Testing

Dopo il reset, testa che tutto funzioni:

```bash
# 1. Avvia il server
npm start

# 2. Verifica API health
curl http://localhost:3000/api/health

# 3. Accedi alla dashboard auditing
# http://localhost:3000/dashboard/auditing/
# Login: organization@certicredia.test / Org123!@#

# 4. Verifica dati CPF
# Dovresti vedere "Organization Demo" con assessment al ~38-50%
```

## 🛠️ Troubleshooting

### Errore: "must be owner of schema public"

**Soluzione:**
```bash
sudo -u postgres psql -d certicredia -c "ALTER SCHEMA public OWNER TO certicredia_user;"
```

### Errore: "Connection refused"

**Soluzione:**
```bash
sudo service postgresql start
```

### Errore: "DATABASE_URL non definito"

**Soluzione:**
Crea file `.env` nella root del progetto:
```env
DATABASE_URL=postgresql://certicredia_user:certicredia123@localhost:5432/certicredia
```

### Dati duplicati

Se vedi dati duplicati (es. 42 organizzazioni invece di 21), significa che il DROP non ha funzionato.

**Soluzione:**
```bash
# 1. Assegna ownership
sudo -u postgres psql -d certicredia -c "ALTER SCHEMA public OWNER TO certicredia_user;"

# 2. Ri-esegui MASTER_RESET
./scripts/MASTER_RESET.sh
```

## 📝 File Correlati

- **Script principale:** `scripts/MASTER_RESET.sh`
- **Schema SQL:** `core/database/schema/complete_schema.sql`
- **Seed utenti/org:** `scripts/seedEnhancedDemoData.js`
- **Seed CPF:** `scripts/seed-perfect-cpf-data.js`
- **Script vecchio (deprecato):** `scripts/resetDatabase.sh`

## ⚡ Quick Reference

```bash
# Setup iniziale
sudo service postgresql start
sudo -u postgres psql -d certicredia -c "ALTER SCHEMA public OWNER TO certicredia_user;"

# Reset completo
./scripts/MASTER_RESET.sh
# Digita: SI → ELIMINA TUTTO → certicredia

# Verifica
npm start
# Vai su http://localhost:3000
```

## 🔒 Sicurezza

Lo script ha **3 livelli di conferma** per prevenire esecuzioni accidentali:

1. ⚠️ Prima conferma: consapevolezza generale
2. ⚠️ Seconda conferma: consapevolezza perdita dati
3. 🔥 Terza conferma: conferma definitiva

**Mai eseguire in produzione!**

## 📊 Monitoraggio

Puoi monitorare il progresso guardando l'output colorato:

- 🔴 **ROSSO:** Warnings critici
- 🟡 **GIALLO:** Conferme e warnings
- 🔵 **BLU:** Step in corso
- 🟢 **VERDE:** Operazioni completate

## 🎓 Note per Sviluppatori

Se modifichi lo schema SQL o gli script di seed:

1. Testa sempre con `MASTER_RESET.sh`
2. Verifica che i count finali siano corretti
3. Controlla che non ci siano duplicate
4. Testa login con tutti e 4 gli account

## 📞 Supporto

Se riscontri problemi:

1. Leggi la sezione **Troubleshooting** sopra
2. Verifica i log di PostgreSQL
3. Controlla che i prerequisiti siano soddisfatti
4. Apri un issue su GitHub

---

**Versione:** 1.0
**Data:** 2026-01-01
**Autore:** CertiCredia Team
