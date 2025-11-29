# 🛡️ CertiCredia Italia - Piattaforma Certificazioni Cybersecurity

Piattaforma web completa per la gestione delle certificazioni di cybersecurity con backend Node.js, database PostgreSQL e sistema di notifiche email.

---

## 🚀 Caratteristiche

- **Frontend Vanilla JS/CSS/HTML** - Nessun framework pesante, solo tecnologie web native
- **Backend Node.js + Express** - API RESTful robusta e scalabile
- **Database PostgreSQL (Neon)** - Archiviazione dati serverless e sicura
- **Sistema Email Automatico** - Notifiche via SMTP con Nodemailer
- **Deployment Ready** - Configurato per Render.com
- **Security First** - Helmet, CORS, Rate Limiting, Validazione Input

---

## 📋 Prerequisiti

- **Node.js** >= 18.0.0
- **npm** o **yarn**
- Account **Neon** (database PostgreSQL serverless)
- Server SMTP per email (Gmail, SendGrid, Mailgun, ecc.)

---

## 🛠️ Installazione Locale

### 1. Clona il repository

```bash
git clone https://github.com/xbeat/certicredia.git
cd certicredia
```

### 2. Installa le dipendenze

```bash
npm install
```

### 3. Configura le variabili d'ambiente

Crea un file `.env` nella root del progetto (copia da `.env.example`):

```bash
cp .env.example .env
```

Modifica il file `.env` con i tuoi parametri:

```env
# Server
NODE_ENV=development
PORT=3000

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://username:password@your-neon-host.neon.tech/certicredia?sslmode=require

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=request@certicredia.org
SMTP_PASS=your-app-password

# Notification
NOTIFICATION_EMAIL=request@certicredia.org
CORS_ORIGIN=*
```

### 4. Avvia il server

```bash
# Modalità produzione
npm start

# Modalità sviluppo (con auto-reload)
npm run dev
```

Il server sarà disponibile su `http://localhost:3000`

---

## 🗄️ Setup Database PostgreSQL (Neon)

### 1. Crea un progetto su Neon

1. Vai su [neon.tech](https://neon.tech)
2. Crea un nuovo progetto
3. Copia la **connection string** che ti viene fornita

### 2. Configura la connection string

La connection string ha questo formato:

```
postgresql://username:password@hostname.neon.tech/dbname?sslmode=require
```

Incollala nel file `.env` come valore di `DATABASE_URL`.

### 3. Schema automatico

Il database viene inizializzato automaticamente all'avvio del server. Lo schema include:

- **Tabella `contacts`**: Memorizza tutti i form di registrazione
  - `id` (SERIAL PRIMARY KEY)
  - `user_type` (COMPANY | SPECIALIST)
  - `name`, `email`, `company`, `linkedin`, `message`
  - `created_at`, `ip_address`, `user_agent`
  - `status` (new, contacted, closed)
  - `notes` (per uso interno)

---

## 📧 Configurazione Email SMTP

### Opzione 1: Gmail

1. Abilita la **2-Step Verification** sul tuo account Google
2. Genera una **App Password**:
   - Vai su [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Genera una password per "Mail"
3. Usa queste credenziali:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=request@certicredia.org
SMTP_PASS=your-16-char-app-password
```

### Opzione 2: SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Opzione 3: Provider Custom

Contatta il tuo provider email e richiedi:
- SMTP Host
- SMTP Port
- Username
- Password

---

## 🌐 Deployment su Render

### Metodo 1: Deploy Automatico (Consigliato)

1. **Crea un account su [Render.com](https://render.com)**

2. **Connetti il repository GitHub**:
   - New → Web Service
   - Collega il tuo repository GitHub

3. **Render rileverà automaticamente il file `render.yaml`**

4. **Configura le Environment Variables**:
   - Dashboard → Environment
   - Aggiungi tutte le variabili da `.env.example`:
     - `DATABASE_URL`
     - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
     - Altre variabili necessarie

5. **Deploy!**
   - Render installerà le dipendenze e avvierà il server automaticamente

### Metodo 2: Deploy Manuale

1. Vai su Render Dashboard
2. New → Web Service
3. Configurazioni:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
   - **Branch**: `main` (o il tuo branch)

---

## 📁 Struttura del Progetto

```
certicredia/
├── server/
│   ├── config/
│   │   ├── database.js       # Connessione PostgreSQL
│   │   └── email.js          # Configurazione Nodemailer
│   ├── controllers/
│   │   └── contactController.js  # Logica business form
│   ├── middleware/
│   │   └── validation.js     # Validazione input
│   ├── routes/
│   │   └── contact.js        # API routes
│   ├── utils/
│   │   └── logger.js         # Utility logging
│   └── index.js              # Entry point server
├── index.html                # Frontend
├── app.js                    # JavaScript frontend
├── styles.css                # Stili CSS
├── package.json              # Dipendenze
├── .env.example              # Template variabili ambiente
├── render.yaml               # Configurazione Render
└── README.md                 # Questa guida
```

---

## 🔌 API Endpoints

### **POST** `/api/contact`

Invia un form di contatto.

**Body (JSON)**:
```json
{
  "userType": "COMPANY",
  "name": "Mario Rossi",
  "email": "mario@example.com",
  "company": "Acme Inc. - P.IVA 12345678901",
  "message": "Vorrei maggiori informazioni sulla certificazione CPF3"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Richiesta ricevuta con successo. Ti contatteremo entro 24 ore.",
  "data": {
    "id": 123,
    "userType": "COMPANY",
    "name": "Mario Rossi",
    "email": "mario@example.com",
    "createdAt": "2025-11-29T10:30:00.000Z"
  }
}
```

### **GET** `/api/health`

Health check del server e database.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-29T10:30:00.000Z",
  "database": "connected"
}
```

### **GET** `/api/contact` *(Admin)*

Recupera tutti i contatti (da proteggere con autenticazione).

**Query params**:
- `status` - Filtra per stato (new, contacted, closed)
- `userType` - Filtra per tipo (COMPANY, SPECIALIST)
- `limit` - Numero massimo risultati (default: 50)
- `offset` - Offset per paginazione (default: 0)

---

## 🔒 Security Features

- **Helmet.js** - Security headers HTTP
- **CORS** - Cross-Origin Resource Sharing configurabile
- **Rate Limiting** - 100 richieste per IP ogni 15 minuti
- **Input Validation** - express-validator per sanitizzazione
- **SQL Injection Protection** - Query parametrizzate con pg
- **XSS Protection** - Sanitizzazione input

---

## 🧪 Test del Sistema

### Test Manuale

1. Avvia il server:
   ```bash
   npm start
   ```

2. Apri il browser su `http://localhost:3000`

3. Compila il form di contatto e invia

4. Verifica:
   - Email ricevuta su `NOTIFICATION_EMAIL`
   - Auto-risposta ricevuta sull'email inserita nel form
   - Dato salvato nel database

### Test API con cURL

```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "userType": "COMPANY",
    "name": "Test User",
    "email": "test@example.com",
    "company": "Test Company",
    "message": "Test message"
  }'
```

---

## 📊 Gestione Database

### Visualizzare i contatti

```sql
-- Tutti i contatti
SELECT * FROM contacts ORDER BY created_at DESC;

-- Solo aziende
SELECT * FROM contacts WHERE user_type = 'COMPANY';

-- Nuovi contatti non gestiti
SELECT * FROM contacts WHERE status = 'new';
```

### Aggiornare stato contatto

```sql
UPDATE contacts
SET status = 'contacted', notes = 'Email inviata il 29/11/2025'
WHERE id = 123;
```

---

## 🚨 Troubleshooting

### Errore: "Database connection failed"

- Verifica che `DATABASE_URL` sia corretto
- Controlla che Neon sia attivo e raggiungibile
- Verifica SSL mode: `?sslmode=require`

### Errore: "Email transporter non configurato"

- Verifica tutte le variabili SMTP in `.env`
- Controlla username/password SMTP
- Per Gmail, usa App Password, non la password normale

### Errore: "Port already in use"

```bash
# Trova il processo che usa la porta 3000
lsof -ti:3000

# Uccidi il processo
kill -9 $(lsof -ti:3000)
```

---

## 🔮 Roadmap Futuro

- [ ] **Area riservata utenti** - Autenticazione JWT
- [ ] **E-commerce** - Sistema di pagamento per certificazioni
- [ ] **Admin Dashboard** - Gestione contatti e ordini
- [ ] **CRM Integration** - Webhook per HubSpot/Salesforce
- [ ] **Analytics** - Dashboard metriche e statistiche
- [ ] **Multi-lingua** - Supporto EN/IT

---

## 📝 License

Copyright © 2025 CertiCredia Italia S.r.l.

---

## 🤝 Supporto

Per assistenza tecnica:
- **Email**: request@certicredia.org
- **GitHub**: [github.com/xbeat/certicredia](https://github.com/xbeat/certicredia)

---

**Fatto con ❤️ per la sicurezza del futuro digitale**
