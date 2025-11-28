# Certicredia - Cybersecurity Psychology Framework Certification Hub

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![License](https://img.shields.io/badge/license-PROPRIETARY-red.svg)

Hub esclusivo di certificazione per il **Cybersecurity Psychology Framework (CPF)**.

## 🚀 Quick Start

### Prerequisiti

- **Node.js** >= 18.0.0
- **PostgreSQL** >= 14.0
- **npm** o **yarn**

### Installazione

1. **Installa le dipendenze**:
   ```bash
   npm install
   ```

2. **Configura l'ambiente**:
   ```bash
   cp .env.example .env
   ```

   Modifica `.env` con le tue credenziali:
   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=certicredia
   DB_USER=postgres
   DB_PASSWORD=your_password

   # Security
   JWT_SECRET=your_super_secret_jwt_key_CHANGE_THIS
   SESSION_SECRET=your_session_secret_CHANGE_THIS
   ```

3. **Crea il database PostgreSQL**:
   ```bash
   createdb certicredia
   ```

4. **Esegui le migrazioni**:
   ```bash
   npm run db:migrate
   ```

5. **Popola il database con dati di esempio** (opzionale):
   ```bash
   npm run db:seed
   ```

   **⚠️ IMPORTANTE**: Cambia la password admin di default (`Admin123!`) dopo il primo accesso.

6. **Avvia il server**:
   ```bash
   npm start
   ```

   O in modalità sviluppo con auto-reload:
   ```bash
   npm run dev
   ```

7. **Apri il browser**:
   ```
   http://localhost:3000
   ```

## 📁 Struttura del Progetto

```
certicredia/
├── server.js                 # Entry point del server Express
├── package.json              # Dipendenze e scripts
├── .env.example              # Template variabili d'ambiente
│
├── config/
│   └── database.js           # Configurazione PostgreSQL
│
├── database/
│   ├── schema.sql            # Schema database completo
│   └── seed.sql              # Dati di esempio
│
├── middleware/
│   ├── auth.js               # Autenticazione JWT
│   ├── errorHandler.js       # Gestione errori
│   └── i18nMiddleware.js     # Middleware multilingua
│
├── routes/
│   ├── web.js                # Routes per pagine HTML
│   ├── api.js                # API generali (prodotti, contatti)
│   ├── auth.js               # API autenticazione
│   └── ecommerce.js          # API ecommerce (carrello, ordini)
│
├── scripts/
│   ├── migrate.js            # Script migrazione database
│   └── seed.js               # Script popolamento dati
│
├── locales/
│   ├── it.json               # Traduzioni italiane
│   └── en.json               # Traduzioni inglesi
│
├── public/
│   ├── css/
│   │   ├── main.css          # Stili base e utilities
│   │   ├── components.css    # Componenti (navbar, cards, etc.)
│   │   └── responsive.css    # Media queries responsive
│   │
│   ├── js/
│   │   ├── i18n.js           # Sistema multilingua client-side
│   │   ├── navigation.js     # Navbar e navigazione
│   │   └── animations.js     # Animazioni scroll
│   │
│   └── images/
│       └── logo.svg          # Logo Certicredia
│
└── views/
    ├── index.html            # Homepage
    ├── aziende.html          # Pagina servizi per aziende
    ├── academy.html          # Pagina formazione Assessor
    ├── login.html            # Login
    ├── register.html         # Registrazione
    ├── prodotti.html         # Catalogo prodotti
    ├── carrello.html         # Carrello
    ├── checkout.html         # Checkout
    ├── dashboard.html        # Dashboard utente
    ├── chi-siamo.html        # Chi siamo
    ├── framework.html        # Il Framework CPF
    └── 404.html              # Pagina errore 404
```

## 🔐 Funzionalità Implementate

### Backend

✅ **Server Express** con security middleware (Helmet, CORS, Rate Limiting)
✅ **Database PostgreSQL** con schema completo (users, products, orders, assessments)
✅ **Autenticazione JWT** con session management e bcrypt
✅ **Sistema i18n** multilingua (IT/EN)
✅ **API RESTful** per:
  - Autenticazione (register, login, logout)
  - Prodotti (lista, dettaglio)
  - Carrello (add, update, remove)
  - Checkout e ordini
  - Contatti

### Frontend

✅ **Design Responsive** (mobile-first)
✅ **Homepage** con Hero, Trust Bar, Problem, Paths, Matrix Preview
✅ **Pagine Aziende** con pricing e benefici
✅ **Academy** con programma corso e form candidatura
✅ **Ecommerce** completo (prodotti, carrello, checkout)
✅ **Autenticazione** (login, registrazione)
✅ **Dashboard** utente
✅ **Sistema multilingua** client-side
✅ **Animazioni scroll** e transizioni

### Design System

✅ **Color Palette** CPF-branded:
  - Primary: Deep Navy Blue (#0A2540)
  - Secondary: Teal (#2D5F5D)
  - Accent: Alert Red (#DC2626)

✅ **Components**: Navbar, Cards, Buttons, Forms, Modal, Badges, Stats, Pricing
✅ **Glassmorphism** e design moderno
✅ **Accessibilità** (ARIA labels, focus-visible, reduced motion)

## 🛠️ Comandi Disponibili

```bash
# Avvio server
npm start              # Produzione
npm run dev            # Sviluppo (con nodemon)

# Database
npm run db:migrate     # Esegue migrazioni
npm run db:seed        # Popola con dati di esempio
```

## 🔑 Credenziali di Default

Dopo aver eseguito `npm run db:seed`, puoi accedere con:

**Email**: `admin@certicredia.com`
**Password**: `Admin123!`

**⚠️ CAMBIA IMMEDIATAMENTE QUESTA PASSWORD IN PRODUZIONE!**

## 🌍 Multilingua

Il sito supporta **Italiano** e **Inglese**. Per cambiare lingua:

1. Usa lo switcher nella navbar
2. La preferenza viene salvata in `localStorage`
3. Le traduzioni sono in `/locales/it.json` e `/locales/en.json`

## 📊 Database Schema

Il database include le seguenti tabelle principali:

- `users` - Utenti del sistema
- `assessors` - Profili Assessor certificati
- `products` - Prodotti e servizi (certificazioni, corsi, libri)
- `orders` - Ordini
- `order_items` - Dettagli ordini
- `assessments` - Valutazioni CPF
- `cart_items` - Carrello
- `sessions` - Sessioni JWT
- `contact_submissions` - Richieste di contatto

## 🔒 Sicurezza

- **Password hashing** con bcrypt (12 rounds)
- **JWT** con scadenza configurabile
- **Rate limiting** sugli endpoint API e auth
- **Helmet.js** per security headers
- **SQL injection protection** con prepared statements
- **CORS** configurabile per ambiente
- **Session blacklisting** per logout

## 📝 API Endpoints

### Autenticazione
```
POST   /api/auth/register     # Registrazione
POST   /api/auth/login        # Login
POST   /api/auth/logout       # Logout (protected)
GET    /api/auth/me           # Dati utente corrente (protected)
```

### Prodotti
```
GET    /api/products          # Lista prodotti
GET    /api/products/:id      # Dettaglio prodotto
```

### Ecommerce
```
GET    /api/ecommerce/cart                # Carrello (protected)
POST   /api/ecommerce/cart                # Aggiungi al carrello (protected)
PUT    /api/ecommerce/cart/:itemId        # Aggiorna quantità (protected)
DELETE /api/ecommerce/cart/:itemId        # Rimuovi dal carrello (protected)
POST   /api/ecommerce/checkout            # Checkout (protected)
GET    /api/ecommerce/orders              # Lista ordini (protected)
GET    /api/ecommerce/orders/:orderId     # Dettaglio ordine (protected)
```

### Altro
```
POST   /api/contact           # Invio form contatti
GET    /api/stats             # Statistiche pubbliche
GET    /health                # Health check
```

## 🚀 Deploy in Produzione

### Variabili d'Ambiente Produzione

```env
NODE_ENV=production
PORT=3000
DB_HOST=your-production-db-host
DB_NAME=certicredia_prod
JWT_SECRET=USE_A_LONG_RANDOM_STRING_HERE
SESSION_SECRET=USE_ANOTHER_LONG_RANDOM_STRING
```

### Checklist Pre-Deploy

- [ ] Cambia `JWT_SECRET` e `SESSION_SECRET`
- [ ] Configura database di produzione
- [ ] Esegui migrazioni su DB produzione
- [ ] **NON** eseguire seed in produzione (contiene password di default)
- [ ] Configura HTTPS
- [ ] Imposta `NODE_ENV=production`
- [ ] Configura backup automatici database
- [ ] Imposta monitoring e logging

## 📄 License

PROPRIETARY - Tutti i diritti riservati © 2024 Certicredia

---

**Powered by CPF3.org** - Schema Owner del Cybersecurity Psychology Framework
