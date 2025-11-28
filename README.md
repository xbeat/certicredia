# CertiCredia Italia - Website

Sito web istituzionale per CertiCredia Italia, ente di certificazione cybersecurity.

## Tecnologie

Questo sito è sviluppato in **HTML, CSS e JavaScript puro (vanilla)**, senza framework o dipendenze esterne.

- **HTML5**: Struttura semantica del sito
- **CSS3**: Stili personalizzati + Tailwind CSS (via CDN)
- **Vanilla JavaScript**: Logica interattiva (navbar, form, chatbot)

## Struttura del Progetto

```
certicredia/
├── index.html      # Pagina principale
├── styles.css      # Stili personalizzati
├── app.js          # Logica JavaScript
├── README.md       # Questo file
└── .gitignore      # File da ignorare in Git
```

## Come Eseguire Localmente

### Opzione 1: Server HTTP locale (consigliato)

Usa uno dei seguenti metodi per avviare un server HTTP locale:

**Con Python 3:**
```bash
python3 -m http.server 8000
```

**Con Node.js (http-server):**
```bash
npx http-server -p 8000
```

**Con PHP:**
```bash
php -S localhost:8000
```

Poi apri il browser su: `http://localhost:8000`

### Opzione 2: Apertura diretta

Puoi anche aprire direttamente il file `index.html` nel browser, ma alcune funzionalità potrebbero non funzionare correttamente a causa delle restrizioni CORS.

## Funzionalità

### ✅ Implementate

- [x] Navbar responsive con effetto scroll
- [x] Hero section con call-to-action
- [x] Sezioni per Specialisti e Aziende
- [x] Processo di certificazione in 4 step
- [x] Form di contatto con switch Company/Specialist
- [x] Footer con link e informazioni
- [x] Chatbot AI assistente (con risposte simulate)
- [x] Smooth scroll per navigazione
- [x] Design responsive per mobile

### 🔧 Da Implementare (opzionale)

- [ ] Integrazione API Gemini per chatbot AI reale
- [ ] Form submission backend
- [ ] Animazioni avanzate (scroll animations)
- [ ] Dark/Light mode toggle

## Chatbot AI

Il chatbot attualmente usa risposte simulate per funzionare senza dipendenze esterne.

Per integrare Google Gemini AI:
1. Ottieni una API key da [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Modifica `app.js` nella sezione "AI CHATBOT"
3. Sostituisci la funzione `simulateAIResponse` con una chiamata API reale

## Personalizzazione

### Modificare i Colori

I colori principali sono definiti tramite Tailwind CSS:
- **Cyan-500**: `#06b6d4` (colore primario)
- **Slate-900**: `#0f172a` (sfondo scuro)

Per modificarli, aggiorna le classi Tailwind in `index.html` o aggiungi stili custom in `styles.css`.

### Modificare i Contenuti

Tutti i contenuti testuali si trovano direttamente in `index.html`. Modifica il testo nelle sezioni:
- `#hero` - Sezione iniziale
- `#specialists` - Per specialisti
- `#companies` - Per aziende
- `#process` - Metodologia
- `#contact` - Form di contatto

## Browser Support

- Chrome/Edge (ultime 2 versioni)
- Firefox (ultime 2 versioni)
- Safari (ultime 2 versioni)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Licenza

© 2025 CertiCredia Italia S.r.l. - Tutti i diritti riservati

## Contatti

Per supporto o domande: info@certicredia.it
