# CPF Dashboard - Auditing Module

## 📦 Overview

Dashboard dedicata per il **CPF Auditing** (Cognitive Persuasion Framework), integrata con il sistema di accreditamento CertiCredia.

**Funzionalità:**
- ✅ Assessment CPF con 100 indicatori organizzati in 10 categorie
- ✅ Analisi di maturità e rischio per organizzazioni
- ✅ Dashboard multitenant con gestione permessi
- ✅ Sistema multilingua (IT/EN)
- ✅ Export/import dati assessment
- ✅ Integrazione completa con backend PostgreSQL

---

## 📁 Struttura Repository

```
dashboard/
├── README.md                # Questa guida
│
├── auditing/                # CPF Auditing Dashboard
│   ├── index.html           # Dashboard principale
│   ├── dashboard.js         # Logica dashboard (legacy)
│   ├── client-integrated.js # Client CPF refactored (ES6+)
│   ├── client-integrated.css
│   ├── styles.css
│   ├── translations.js      # Sistema i18n
│   ├── reference_guide_*.json  # Guide di riferimento (IT/EN)
│   ├── category-descriptions.json
│   ├── README.md            # Documentazione dettagliata
│   └── js/                  # Moduli ES6+
│       ├── client/          # Client field kit
│       ├── dashboard/       # Dashboard logic
│       └── shared/          # Utilities condivise
│
└── shared/                  # Componenti condivisi
    ├── ui-utils.js          # Utility UI
    ├── i18n-utils.js        # Sistema internazionalizzazione
    ├── styles.css           # Stili globali
    └── README.md
```

---

## 🚀 Quick Start

### 1. Setup Database

```bash
# Crea tabelle per CPF auditing
node scripts/setup-cpf-auditing-db.js

# Popola con dati di esempio
node scripts/seed-cpf-auditing.js
```

### 2. Avvio Server

```bash
# Dalla root del progetto
npm start
```

Il server Express servirà automaticamente i file statici della dashboard.

### 3. Accesso

**Metodo 1: Da Admin Panel (Raccomandato)**
1. Apri `http://localhost:3000/admin.html`
2. Login con credenziali admin
3. Vai alla sezione "Organizzazioni"
4. Clicca sull'icona verde "Dashboard" per un'organizzazione
5. Si apre in nuova tab la dashboard auditing per quella specifica organizzazione

**Metodo 2: Accesso Diretto (Multi-Organization)**
- Dashboard completa: `http://localhost:3000/dashboard/auditing/index.html`
- Visualizza tutte le organizzazioni con sidebar di selezione

**Metodo 3: URL Diretto per Organizzazione**
- `http://localhost:3000/dashboard/auditing/index.html#organization/123`
- Apre direttamente la dashboard per l'organizzazione con ID 123
- Nasconde la sidebar (modalità single-organization)

---

## 🏗️ Architettura

### Backend Integration

La dashboard è completamente integrata con il backend principale CertiCredia:

**API Endpoints:**
- `GET /api/auditing/organizations/:id` - Ottieni assessment per organizzazione
- `POST /api/auditing/organizations/:id` - Crea nuovo assessment
- `PUT /api/auditing/organizations/:id` - Aggiorna assessment
- `DELETE /api/auditing/organizations/:id` - Soft delete (trash)
- `POST /api/auditing/organizations/:id/restore` - Ripristina da trash
- `GET /api/auditing/assessments` - Lista tutti gli assessment
- `GET /api/auditing/trash` - Assessment eliminati
- `GET /api/auditing/statistics` - Statistiche generali

**Database:**
- Tabella: `cpf_auditing_assessments`
- Storage: JSONB per 100 indicatori CPF
- Relazione: FK a `organizations` table
- Soft delete: Supporto trash con `deleted_at`

### Frontend Architecture (ES6+)

Architettura modulare con componenti specializzati:

```
dashboard/auditing/js/
├── client/           # Client Field Kit (assessment form)
│   ├── api.js
│   ├── events.js
│   ├── render.js
│   ├── scoring.js
│   └── state.js
├── dashboard/        # Dashboard principale
│   ├── api.js        # Chiamate API backend
│   ├── charts.js     # Grafici D3/Chart.js
│   ├── events.js     # Event handlers
│   ├── index.js      # Entry point + URL routing
│   ├── modals.js     # Modali UI
│   ├── render-*.js   # Rendering componenti
│   └── state.js      # State management
└── shared/           # Utilities condivise
    ├── config.js
    └── utils.js
```

---

## 🔐 Multi-Tenancy & Permissions

### Admin Users
- Vedono **tutte** le organizzazioni nella sidebar
- Possono creare, modificare, eliminare assessment
- Accesso a statistiche globali

### Organization Users
- Vedono **solo** la propria organizzazione
- Possono modificare solo il proprio assessment
- Non vedono la sidebar (modalità single-org automatica)

### URL Routing

La dashboard supporta due modalità:

1. **Multi-Organization Mode** (default)
   - URL: `/dashboard/auditing/index.html`
   - Mostra sidebar con lista organizzazioni
   - Admin può selezionare qualsiasi organizzazione

2. **Single-Organization Mode**
   - URL: `/dashboard/auditing/index.html#organization/:id`
   - Nasconde sidebar
   - Carica automaticamente l'organizzazione specificata
   - Usato quando aperto da admin panel

---

## 📊 CPF Assessment Structure

**100 Indicatori** organizzati in **10 Categorie**:

1. Governance & Leadership
2. Risk Management
3. Asset Management
4. Access Control
5. Awareness & Training
6. Data Security
7. Platform Protection
8. Resilience
9. Relationships
10. Incident Response

Ogni indicatore ha:
- **Valore**: 0 (N/A), 1 (Low), 2 (Medium), 3 (High)
- **Note**: Commenti e osservazioni
- **Last Updated**: Timestamp ultimo aggiornamento

**Metadata Calcolati:**
- Completion Percentage
- Maturity Score (0-100)
- Maturity Level (Initial → Optimized)
- Risk Score (inverso di maturity)

---

## 🛠️ Development

### File Structure

```
auditing/
├── index.html                 # HTML principale
├── js/                        # Codice ES6+ modulare
│   ├── client/                # Client field kit
│   ├── dashboard/             # Dashboard logic
│   └── shared/                # Shared utilities
├── styles.css
├── client-integrated.css
├── translations.js
├── reference_guide_it-IT.json
└── reference_guide_en-US.json
```

### Adding New Features

1. **Backend**: Aggiungi endpoint in `modules/auditing/`
2. **Frontend**: Aggiungi logica in `js/dashboard/` o `js/client/`
3. **UI**: Modifica `index.html` e `styles.css`
4. **i18n**: Aggiorna `translations.js`

---

## 📝 Scripts

### Setup Database
```bash
node scripts/setup-cpf-auditing-db.js
```
Crea database, utente, tabelle e indici per CPF auditing.

### Seed Data
```bash
node scripts/seed-cpf-auditing.js
```
Genera assessment di esempio per organizzazioni esistenti.

---

## 🌍 Internazionalization (i18n)

Sistema multilingua completo:
- Italiano (IT) - Default
- English (EN)

**File coinvolti:**
- `shared/i18n-utils.js` - Sistema i18n
- `translations.js` - Traduzioni dashboard
- `reference_guide_it-IT.json` - Guida riferimento IT
- `reference_guide_en-US.json` - Guida riferimento EN

---

## 📦 Dependencies

**Backend:**
- Express.js
- PostgreSQL (pg)
- dotenv

**Frontend:**
- Chart.js (grafici)
- D3.js (visualizzazioni)
- html2pdf.js (export PDF)
- js-yaml (parsing YAML)

Tutte le dipendenze frontend sono caricate via CDN.

---

## 🚀 Deployment

### Production Checklist

1. ✅ Setup database con `setup-cpf-auditing-db.js`
2. ✅ Seed dati con `seed-cpf-auditing.js`
3. ✅ Configura variabili ambiente (.env)
4. ✅ Avvia server: `npm start`
5. ✅ Verifica accesso da admin panel
6. ✅ Test creazione/modifica assessment
7. ✅ Verifica permessi multi-tenant

---

## 📚 Documentation

- **Main README**: `README.md` (questo file)
- **Auditing Guide**: `auditing/README.md`
- **API Documentation**: Vedere modulo `modules/auditing/`
- **Architecture**: `ARCHITECTURE.md` (root del progetto)

---

## 🤝 Support

Per assistenza e bug report:
- GitHub Issues: [certicredia/issues](https://github.com/xbeat/certicredia/issues)
- Documentation: Vedere file README specifici

---

## 📄 License

Copyright © 2025 CertiCredia Italia
