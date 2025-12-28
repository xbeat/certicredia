# PROCEDURA RESET DATABASE

## Soluzione RAPIDA (Raccomandato)

Se hai problemi di caricamento dati o dati non allineati, usa questo comando:

```bash
cd /home/user/certicredia
./scripts/resetDatabase.sh
```

Questo script:
1. ✅ Pulisce completamente il database
2. ✅ Ricrea tutte le tabelle
3. ✅ Inserisce i dati demo
4. ✅ Mostra le credenziali di accesso

---

## Soluzione MANUALE (Se lo script non funziona)

### 1. Pulisci il database

```bash
psql -U postgres -d certicredia
```

Poi esegui:

```sql
-- Drop tutte le tabelle
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

\q
```

### 2. Ricrea le tabelle

```bash
cd /home/user/certicredia
node server/migrate.js
```

### 3. Inserisci dati demo

```bash
node scripts/seedEnhancedDemoData.js
```

---

## Credenziali Demo

Dopo il reset, usa queste credenziali:

| Ruolo | Email | Password |
|-------|-------|----------|
| **Admin** | admin@certicredia.test | Admin123!@# |
| **Ente** | ente@certicredia.test | Ente123!@# |
| **Specialist** | specialist@certicredia.test | Specialist123!@# |
| **Candidato** | candidate@certicredia.test | Candidate123!@# |

---

## Problemi Comuni

### Errore "permission denied"
```bash
chmod +x /home/user/certicredia/scripts/resetDatabase.sh
```

### Errore "database does not exist"
```bash
psql -U postgres -c "CREATE DATABASE certicredia;"
```

### Errore "role postgres does not exist"
Usa il tuo utente PostgreSQL invece di `postgres`:
```bash
psql -U tuoutente -d certicredia
```

---

## Dopo il Reset

1. **Riavvia il server**:
   ```bash
   cd /home/user/certicredia/server
   node index.js
   ```

2. **Apri il browser**: http://localhost:3000

3. **Login** con le credenziali demo sopra

4. **Verifica** che i dati si carichino correttamente in tutte le dashboard

---

## Note Importanti

⚠️ **ATTENZIONE**: Il reset elimina TUTTI i dati!

✅ **Usa in sviluppo/test** - Non usare in produzione!

📝 **Backup**: Se hai dati importanti, fai un backup prima del reset:
```bash
pg_dump -U postgres certicredia > backup_$(date +%Y%m%d_%H%M%S).sql
```
