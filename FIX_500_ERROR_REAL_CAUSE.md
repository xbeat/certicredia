# Fix per Errore 500 sulla Dashboard - VERA CAUSA ROOT

## 🔴 Il Problema Reale

L'errore 500 sulla chiamata `/api/auditing/organizations/1` NON è causato dalla mancanza della tabella `cpf_auditing_assessments`, ma dalla **mancanza delle colonne `subscription_*` nella tabella `organizations`**.

## 🎯 La Vera Storia del Bug

### Commit Colpevole: `c700b48` (10 gennaio 2026)
Dentro il merge **b250ae3** (PR #97), il commit `c700b48` "Implement subscription-based dashboard access control" ha introdotto:

1. ✅ Il middleware `requireActiveSubscription` in `server/middleware/checkSubscription.js`
2. ✅ La migration `add_subscription_fields_to_organizations.sql`
3. ❌ **MA NON ha aggiornato gli schema base**

### Il Bug nel Middleware

Il middleware `requireActiveSubscription` (linea 28-33 in `checkSubscription.js`) fa questa query:

```sql
SELECT o.id, o.name, o.subscription_active, o.subscription_expires_at, o.subscription_type
FROM organizations o
INNER JOIN organization_users ou ON o.id = ou.organization_id
WHERE ou.user_id = $1
```

**Colonne richieste:**
- ❌ `subscription_active` - NON ESISTE
- ❌ `subscription_expires_at` - NON ESISTE
- ❌ `subscription_type` - NON ESISTE

Quando PostgreSQL cerca di eseguire questa query su una tabella senza queste colonne → **ERROR: column "subscription_active" does not exist** → 500 Internal Server Error

### Perché Prima Funzionava

**Probabilmente NON funzionava!** Se l'utente dice che funzionava prima, è possibile che:
- Non avesse mai testato con il middleware `requireActiveSubscription` attivo
- La migration era stata eseguita manualmente sul database di test
- Stava testando su route senza il middleware di subscription

### Il Problema degli Schema

Gli schema base **NON includevano** i campi subscription:

❌ `core/database/schema/accreditation_schema.sql` - Tabella `organizations` senza campi subscription
❌ `core/database/schema/complete_schema.sql` - Tabella `organizations` senza campi subscription

Quindi chiunque eseguisse `initDatabase.js` creava una tabella `organizations` **incompleta**.

## ✅ Fix Applicati

### 1. Aggiornato `accreditation_schema.sql`
Aggiunto alla tabella `organizations`:
```sql
-- Subscription (added 2026-01-10)
subscription_active BOOLEAN DEFAULT FALSE,
subscription_expires_at TIMESTAMP WITH TIME ZONE,
subscription_type VARCHAR(50) DEFAULT 'free',
subscription_started_at TIMESTAMP WITH TIME ZONE,
```

Con relativi indici:
```sql
CREATE INDEX idx_organizations_subscription_active ON organizations(subscription_active);
CREATE INDEX idx_organizations_subscription_expires_at ON organizations(subscription_expires_at);
```

### 2. Aggiornato `complete_schema.sql`
Stesso fix applicato allo schema completo.

### 3. Aggiornato `initDatabase.js` (commit precedente)
Aggiunto `cpf_auditing_schema.sql` (problema secondario).

## 🚀 Come Risolvere

### Opzione A: Applica la Migration Esistente
Se hai già un database inizializzato:
```bash
psql $DATABASE_URL < core/database/migrations/add_subscription_fields_to_organizations.sql
```

### Opzione B: Ricrea da Zero (CONSIGLIATO)
```bash
# 1. Reset completo
./scripts/resetDatabase.sh

# 2. Inizializza con schema AGGIORNATO
node scripts/initDatabase.js

# 3. Popola dati demo
node scripts/seedSimpleDemo.js
```

### Opzione C: Aggiungi Colonne Manualmente
```sql
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS subscription_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(50) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_organizations_subscription_active
ON organizations(subscription_active);

CREATE INDEX IF NOT EXISTS idx_organizations_subscription_expires_at
ON organizations(subscription_expires_at);
```

## 📋 Verifica del Fix

```bash
# 1. Verifica che le colonne esistano
psql $DATABASE_URL -c "\d organizations" | grep subscription

# Output atteso:
# subscription_active          | boolean    | | default false
# subscription_expires_at      | timestamp  | |
# subscription_type            | varchar(50)| | default 'free'::character varying
# subscription_started_at      | timestamp  | |
```

## 🔍 Stack Trace Completo

1. **Frontend** chiama: `GET /api/auditing/organizations/1`
2. **Route** in `auditingRoutes.js:57`: `authenticate → requireActiveSubscription → getOrganizationAssessment`
3. **Middleware** `requireActiveSubscription` esegue query SQL con colonne `subscription_*`
4. **PostgreSQL** lancia: `ERROR: column "subscription_active" does not exist`
5. **Middleware** catch error → restituisce **500 Internal Server Error**
6. **Frontend** riceve 500 e mostra errore

## 📦 Commit Applicati

- **b385f54**: Fix initDatabase.js (cpf_auditing_schema.sql mancante)
- **d5cbc1e**: Tool di diagnostica
- **[NUOVO]**: Fix subscription fields negli schema base

## ✅ Checklist Post-Fix

- [ ] Colonne `subscription_*` esistono in tabella `organizations`
- [ ] Indici creati per performance
- [ ] `initDatabase.js` crea tutte le tabelle (inclusa `cpf_auditing_assessments`)
- [ ] Server si avvia senza errori
- [ ] Dashboard carica correttamente
- [ ] Nessun errore 500 nei log

## 💡 Lesson Learned

**Quando aggiungi un middleware che fa query SQL:**
1. ✅ Crea la migration
2. ✅ Aggiorna TUTTI gli schema base
3. ✅ Testa su database pulito (non solo quello esistente)
4. ✅ Documenta le dipendenze
