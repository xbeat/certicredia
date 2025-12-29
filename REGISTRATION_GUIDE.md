# Guida Registrazioni CertiCredia

## Riepilogo Completo

Tutte le funzionalità di registrazione per le diverse tipologie di utente sono state implementate e sono completamente funzionanti.

## 📍 Come Accedere alle Registrazioni

### Percorso Utente
1. Vai alla homepage: `http://localhost:3000/` o `/index.html`
2. Clicca sul pulsante **"Area Gestionale"** nella navbar (in alto a destra)
3. Verrai reindirizzato a `/public/pages/app-landing.html`
4. Nella sezione "Registrati" troverai 3 opzioni:
   - 🏢 **Organizzazione** → Per enti pubblici, aziende, no-profit
   - 🎓 **Specialist** → Per professionisti cybersecurity
   - 🛒 **Utente Ecommerce** → Per acquisti nello shop

## 📂 File e Percorsi

### Frontend (Pagine HTML)

#### 1. Registrazione Organizzazione
- **File**: `/public/pages/register-organization.html`
- **URL**: `http://localhost:3000/public/pages/register-organization.html`
- **Link da**: `/public/pages/app-landing.html` (linea 188)
- **Campi richiesti**:
  - Tipo organizzazione (Ente Pubblico/Azienda Privata/No Profit)
  - Nome organizzazione
  - Indirizzo completo
  - Email organizzazione
  - Dati persona di contatto (nome, cognome, email)
  - Password (min 12 caratteri)

#### 2. Registrazione Specialist
- **File**: `/public/pages/register-specialist.html`
- **URL**: `http://localhost:3000/public/pages/register-specialist.html`
- **Link da**: `/public/pages/app-landing.html` (linea 202)
- **Campi richiesti**:
  - Nome e cognome
  - Email
  - Telefono (opzionale)
  - Anni di esperienza in cybersecurity
  - Bio/CV (opzionale)
  - Password (min 12 caratteri)

#### 3. Registrazione Utente Ecommerce
- **File**: `/shop.html` (contiene form di registrazione)
- **URL**: `http://localhost:3000/shop.html`
- **Link da**: `/public/pages/app-landing.html` (linea 219)

### Backend (API Endpoints)

#### 1. POST `/api/organizations/register`
- **File route**: `/modules/organizations/routes/organizationRoutes.js` (linea 25)
- **File controller**: `/modules/organizations/controllers/organizationController.js` (linea 282)
- **Funzione**: `registerOrganizationHandler`
- **Accesso**: Pubblico (no autenticazione richiesta)
- **Validazione**: Express-validator (password min 12 caratteri, email valida, ecc.)
- **Cosa fa**:
  1. Crea utente con ruolo `organization_admin`
  2. Crea organizzazione con status `pending`
  3. Associa utente all'organizzazione con ruolo `admin`
  4. Tutto in una transazione atomica

#### 2. POST `/api/specialists/register`
- **File route**: `/modules/specialists/routes/specialistRoutes.js` (linea 20)
- **File controller**: `/modules/specialists/controllers/specialistController.js`
- **Funzione**: `registerSpecialistPublicHandler`
- **Accesso**: Pubblico (no autenticazione richiesta)
- **Validazione**: Express-validator (password min 12 caratteri, anni esperienza >= 0)
- **Cosa fa**:
  1. Crea utente con ruolo `specialist`
  2. Crea profilo specialist con status `pending`
  3. Tutto in una transazione atomica

## ✅ Stato Implementazione

| Funzionalità | Stato | Note |
|-------------|-------|------|
| Form HTML Organizzazione | ✅ Completo | JavaScript incluso, validazione client-side |
| Form HTML Specialist | ✅ Completo | JavaScript incluso, validazione client-side |
| API Endpoint Organizzazione | ✅ Completo | Con transazioni DB, validazione server-side |
| API Endpoint Specialist | ✅ Completo | Con transazioni DB, validazione server-side |
| Link da Homepage | ✅ Completo | Pulsante "Area Gestionale" visibile |
| Link da App Landing | ✅ Completo | Due bottoni ben visibili per Org e Specialist |
| Validazione Password | ✅ Completo | Min 12 caratteri, conferma password |
| Gestione Errori | ✅ Completo | Messaggi di errore user-friendly |
| Redirect Post-Registrazione | ✅ Completo | Torna a login dopo 3 secondi |

## 🧪 Test Effettuati

```bash
# Test accessibilità pagine
curl http://localhost:3000/public/pages/app-landing.html         # ✅ 200 OK
curl http://localhost:3000/public/pages/register-organization.html # ✅ 200 OK
curl http://localhost:3000/public/pages/register-specialist.html   # ✅ 200 OK
```

## 📝 Note Tecniche

### Sicurezza
- Password hash con bcrypt (SALT_ROUNDS = 10)
- Validazione input sia client-side che server-side
- Transazioni database per garantire atomicità
- Check email duplicata prima della registrazione

### Database
- Utenti creati con `email_verified = false`
- Organizzazioni create con `status = 'pending'` e `verified = false`
- Specialists creati con `status = 'pending'`
- Richiesta verifica manuale da admin prima dell'attivazione

### UX
- Toggle visibilità password
- Messaggi di successo/errore chiari
- Redirect automatico al login dopo registrazione
- Design responsive con Tailwind CSS

## 🔍 Debugging

Se i form non sono visibili, verificare:

1. **Server in esecuzione**: `npm start` sulla porta 3000
2. **File statici serviti**: Controllare `server/index.js` linea 72
3. **Link corretti**: Verificare che i link in `app-landing.html` puntino a `/public/pages/...`
4. **Console browser**: Aprire DevTools e controllare errori JavaScript
5. **Network tab**: Verificare che i file vengano caricati con status 200

## 📌 Accesso Diretto (per Test)

```
# Homepage
http://localhost:3000/

# Area Gestionale (Login + Links Registrazione)
http://localhost:3000/public/pages/app-landing.html

# Registrazione Diretta Organizzazione
http://localhost:3000/public/pages/register-organization.html

# Registrazione Diretta Specialist
http://localhost:3000/public/pages/register-specialist.html
```

---

**Data creazione**: 29 Dicembre 2025
**Ultima verifica**: Tutti i test passati ✅
