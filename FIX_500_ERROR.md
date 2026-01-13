# Fix per Errore 500 sulla Dashboard

## 🔴 Problema
L'errore 500 sulla chiamata `/api/auditing/organizations/1` è causato dalla **mancanza della tabella `cpf_auditing_assessments`** nel database.

## ✅ Soluzione Rapida

### 1. Verifica il Database
```bash
node scripts/check-database-health.js
```

Questo ti dirà se la tabella `cpf_auditing_assessments` esiste o meno.

### 2. Crea la Tabella Mancante
Se la tabella non esiste, esegui:

```bash
node scripts/setup-cpf-auditing-db.js
```

Questo script:
- Legge lo schema da `core/database/schema/cpf_auditing_schema.sql`
- Crea la tabella `cpf_auditing_assessments`
- Imposta indici e trigger necessari

### 3. (Opzionale) Popola con Dati di Test
Se vuoi dati di esempio:

```bash
node scripts/seed-cpf-auditing.js
```

## 📋 Verifica del Fix

1. Avvia il server:
```bash
npm run dev
```

2. Testa l'endpoint (con un token valido):
```bash
curl -X GET http://localhost:3000/api/auditing/organizations/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Dovrebbe restituire:
- `200 OK` con i dati dell'assessment (se esiste)
- `200 OK` con dati vuoti (se l'organizzazione esiste ma non ha assessment)
- `500 Error` solo se l'organizzazione non esiste

## 🔍 Causa Root del Problema

### Perché Prima Funzionava e Ora No?

**Commit problematico: `32d478c` (1 gennaio 2026)**
"refactor: Rimosso sistema migrazioni, uso schema SQL diretto"

Questo commit ha:
1. ✅ Eliminato le migrazioni JS che creavano `cpf_auditing_assessments`
2. ✅ Creato `complete_schema.sql` che include la tabella
3. ❌ **MA NON ha aggiornato `initDatabase.js`** per includere `cpf_auditing_schema.sql`

### Il Bug in `initDatabase.js`

Lo script `scripts/initDatabase.js` eseguiva solo:
```javascript
- base_schema.sql       ✅
- accreditation_schema.sql  ✅
- cpf_auditing_schema.sql   ❌ MANCAVA!
```

Quindi chiunque abbia inizializzato il database dopo il 1 gennaio 2026 con `initDatabase.js` **non ha la tabella `cpf_auditing_assessments`**.

### Perché Prima Funzionava

- Il database era stato creato con le vecchie migrazioni JS (pre-refactor)
- La tabella `cpf_auditing_assessments` esisteva ancora
- Dopo il refactor, hai continuato a usare lo stesso database

### Perché Ora NON Funziona

- Hai fatto un reset/reinizializzazione del database OPPURE
- Hai creato un nuovo database con `initDatabase.js`
- Lo script incompleto non ha creato la tabella

### Stack Trace dell'Errore

Il controller `getOrganizationAssessment` in:
- File: `modules/auditing/controllers/auditingController.js`
- Linea: 318-389

Fa una query sulla tabella `cpf_auditing_assessments`:

```javascript
const assessment = await auditingService.getAssessmentByOrganization(parseInt(organizationId));
```

Che esegue:
```sql
SELECT a.*, o.name as organization_name, o.organization_type, o.status as organization_status
FROM cpf_auditing_assessments a
JOIN organizations o ON a.organization_id = o.id
WHERE a.organization_id = $1 AND a.deleted_at IS NULL
```

Se la tabella non esiste, PostgreSQL lancia un errore che viene catturato dal try-catch e restituito come 500.

### Fix Applicato

Ho corretto `scripts/initDatabase.js` aggiungendo:
```javascript
// Read CPF auditing schema
const cpfSchemaPath = path.join(__dirname, '../core/database/schema/cpf_auditing_schema.sql');
const cpfSchema = await fs.readFile(cpfSchemaPath, 'utf-8');
await client.query(cpfSchema);
```

Ora `initDatabase.js` crea TUTTE le tabelle necessarie, inclusa `cpf_auditing_assessments`.

## 📝 Note per Produzione

Se stai usando un database cloud (Neon, Supabase, ecc.):

1. Assicurati di avere il `DATABASE_URL` configurato in `.env`
2. Esegui lo script di setup dal tuo ambiente locale:
   ```bash
   DATABASE_URL="postgresql://user:pass@host/db?sslmode=require" node scripts/setup-cpf-auditing-db.js
   ```
3. Oppure connettiti al database e esegui manualmente lo schema:
   ```bash
   psql $DATABASE_URL < core/database/schema/cpf_auditing_schema.sql
   ```

## 🛠️ Script di Supporto Creati

Per aiutarti, ho creato questi script aggiuntivi:

1. **`scripts/check-database-health.js`** - Verifica lo stato del database
2. **`core/database/check-and-create-cpf-table.js`** - Crea solo la tabella CPF se manca

## ✅ Checklist Post-Fix

- [ ] La tabella `cpf_auditing_assessments` esiste
- [ ] Il server si avvia senza errori
- [ ] La dashboard carica correttamente
- [ ] Nessun errore 500 nei log del browser
- [ ] Gli assessment vengono visualizzati (o mostrano dati vuoti se non esistono)
