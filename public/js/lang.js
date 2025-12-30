// Language Management System for CertiCredia
// Supports Italian (it) and English (en-US)

const translations = {
    'it': {
        // Navbar
        'nav.home': 'Home',
        'nav.specialists': 'Specialist',
        'nav.companies': 'Governance',
        'nav.process': 'Metodologia',
        'nav.contact': 'Contatti',
        'nav.shop': 'Shop',
        'nav.cpf3': 'CPF3 Framework',
        'nav.app': 'Area Gestionale',

        // Hero Section
        'hero.badge': 'Nuovo Framework Cybersecurity 2026',
        'hero.title1': 'La sicurezza non è un\'opzione.',
        'hero.title2': 'È una Certificazione.',
        'hero.description': 'CertiCredia è il partner strategico per specialisti che vogliono eccellere e organizzazioni che esigono conformità. Un ecosistema unico per la Cybersecurity.',
        'hero.btn.specialists': 'Per Specialist',
        'hero.btn.companies': 'Per Governance',

        // Stats
        'stats.orgs': 'Organizzazioni Certificate',
        'stats.specialists': 'Specialist Attivi',
        'stats.compliance': 'Compliance',
        'stats.support': 'Supporto',

        // Specialists Section 1
        'specialists.badge': 'PER SPECIALIST',
        'specialists.title': 'Diventa uno Specialist d\'Eccellenza',
        'specialists.description': 'Ti forniamo gli strumenti per diventare lo specialista di fiducia che ogni organizzazione cerca. Ottieni l\'abilitazione all\'uso della nostra suite proprietaria.',
        'specialists.feature1': 'Certificazione Specialist Lead CertiCredia',
        'specialists.feature2': 'Accesso alla piattaforma di assessment riservata',
        'specialists.feature3': 'Network di organizzazioni partner in cerca di specialist',
        'specialists.feature4': 'Formazione continua su nuovi vettori di attacco',
        'specialists.btn': 'Candidati Ora',

        // Specialists Benefits
        'benefits.title': 'Perché scegliere il percorso CertiCredia?',
        'benefits.description': 'Diventare uno specialist non è il traguardo, è l\'inizio della tua ascesa professionale.',
        'benefits.card1.title': 'Figura Innovativa',
        'benefits.card1.description': 'Gli specialist accreditati CertiCredia accedono a un mercato innovativo con una crescita esponenziale della domanda.',
        'benefits.card2.title': 'Community Esclusiva',
        'benefits.card2.description': 'Accesso a canali digitali privati per migliorare la tua conoscenza e la tua rete professionale.',
        'benefits.card3.title': 'Incident Response',
        'benefits.card3.description': 'Partecipa come risorsa ausiliaria nei team di risposta agli incidenti critici dei nostri clienti enterprise.',

        // Specialists Section 2
        'specialists2.title': 'Specialist Accreditato CertiCredia',
        'specialists2.description': 'Le organizzazioni cercano professionisti che vadano oltre la checklist tecnica. L\'accreditamento CertiCredia ti abilita all\'uso del framework psicologico CPF3 per affiancare le organizzazioni.',
        'specialists2.feature1.title': 'Accreditamento Specialist',
        'specialists2.feature1.description': 'Ottieni l\'iscrizione all\'albo degli specialist abilitati all\'analisi pre-cognitiva.',
        'specialists2.feature2.title': 'Accesso al Framework',
        'specialists2.feature2.description': 'Materiale esclusivo sugli indicatori psicologici e accesso agli strumenti di valutazione.',
        'specialists2.requirements': 'Requisiti:',
        'specialists2.req1': 'Esperienza pregressa in IT/Cybersecurity o Psicologia del Lavoro oppure percorso formativo CPF3.',
        'specialists2.req2': 'Superamento dell\'esame finale CPF3.',
        'specialists2.btn': 'Richiedi Informazioni',

        // Specialist Kit
        'kit.title': 'Il Kit dello Specialist',
        'kit.item1': 'Manuale Operativo CPF3:2026',
        'kit.item2': 'Accesso Dashboard Assessment CPF3',
        'kit.item3': 'Materiale Informativo Costantemente Aggiornato',
        'kit.item4': 'Formazione Continua',

        // Career Path
        'career.title': 'Percorso di Accreditamento Specialist',
        'career.description': 'Diventa consulente strategico: aumenta il tuo valore sul mercato.',
        'career.step1.title': 'Training',
        'career.step1.description': 'Corso intensivo su psicologia cognitiva e cybersicurezza.',
        'career.step2.title': 'Accreditation',
        'career.step2.description': 'Esame teorico-pratico e rilascio del badge CPF3 Specialist.',
        'career.step3.title': 'Specialist',
        'career.step3.description': 'Formazione avanzata sugli strumenti operativi del CPF3.',

        // Companies Section
        'companies.badge': 'PER GOVERNANCE',
        'companies.title': 'Conformità che Protegge Realmente',
        'companies.description': 'Non basta una checklist. La cybersecurity richiede comprensione, strategia, e specialist qualificati. CertiCredia è il partner ufficiale per organizzazioni che vogliono trasformare la compliance in un vantaggio competitivo.',
        'companies.feature1': 'Valutazione CPF3 - Framework psicologico per la cybersecurity',
        'companies.feature2': 'Certificazione di conformità conforme a NIS2, DORA, ISO27001',
        'companies.feature3': 'Dashboard real-time per monitorare lo stato della sicurezza',
        'companies.feature4': 'Accesso a specialist certificati per interventi e training',
        'companies.btn': 'Richiedi Demo',

        // Companies Benefits
        'companies.benefits.title': 'I vantaggi per la tua organizzazione',
        'companies.benefits.card1.title': 'Riduzione del Rischio',
        'companies.benefits.card1.description': 'Identifica vulnerabilità comportamentali prima che vengano sfruttate.',
        'companies.benefits.card2.title': 'Compliance Semplificata',
        'companies.benefits.card2.description': 'Un unico framework che copre NIS2, DORA, e ISO27001.',
        'companies.benefits.card3.title': 'ROI Misurabile',
        'companies.benefits.card3.description': 'Dashboard avanzate per dimostrare l\'efficacia della security posture.',

        // Process Section
        'process.title': 'Come Funziona',
        'process.description': 'Un processo strutturato in 4 fasi per garantire la massima efficacia',
        'process.step1.title': 'Assessment Iniziale',
        'process.step1.description': 'Analisi approfondita del contesto organizzativo e delle vulnerabilità comportamentali',
        'process.step2.title': 'Piano di Azione',
        'process.step2.description': 'Definizione di strategie personalizzate basate sul framework CPF3',
        'process.step3.title': 'Implementazione',
        'process.step3.description': 'Deployment guidato con formazione del personale e degli specialist',
        'process.step4.title': 'Certificazione',
        'process.step4.description': 'Validazione e rilascio della certificazione con monitoraggio continuo',

        // Contact Section
        'contact.badge': 'INIZIA ORA',
        'contact.title': 'Hai Domande?',
        'contact.description': 'Il nostro team è pronto ad aiutarti a iniziare il tuo percorso CertiCredia',
        'contact.email.label': 'Email',
        'contact.email.placeholder': 'tuo@email.com',
        'contact.message.label': 'Messaggio',
        'contact.message.placeholder': 'Raccontaci le tue esigenze...',
        'contact.btn': 'Invia Richiesta',
        'contact.alternative': 'Oppure scrivici direttamente a',

        // Footer
        'footer.description': 'Il partner strategico per organizzazioni e specialisti nella cybersecurity moderna.',
        'footer.links': 'Link Utili',
        'footer.link.about': 'Chi Siamo',
        'footer.link.specialists': 'Per Specialist',
        'footer.link.companies': 'Per Organizzazioni',
        'footer.link.docs': 'Documentazione',
        'footer.resources': 'Risorse',
        'footer.link.blog': 'Blog',
        'footer.link.faq': 'FAQ',
        'footer.link.support': 'Supporto',
        'footer.link.privacy': 'Privacy Policy',
        'footer.legal': 'Legale',
        'footer.link.terms': 'Termini di Servizio',
        'footer.link.cookie': 'Cookie Policy',
        'footer.copyright': '© 2024 CertiCredia. Tutti i diritti riservati.',

        // Companies Detailed Section
        'companies.gov.badge': 'LA GOVERNANCE',
        'companies.gov.title': 'La Security Governance, Semplificata',
        'companies.gov.description': 'Il nostro ecosistema ti permette di migliora la maturità della cybersicurezza e della strategia in cybersecurity governance.',
        'companies.dashboard.title': 'Dashboard Compliance',
        'companies.dashboard.description': 'Visualizza il tuo livello di sicurezza in tempo reale e monitora i gap.',
        'companies.matrix.title': 'Matrice di Compilazione',
        'companies.matrix.description': 'Template pre-compilati e guidati per l\'assesment.',
        'companies.demo.btn': 'Richiedi Demo Dashboard',

        // Companies CPF3 Section
        'companies.cpf3.badge': 'PER LA GOVERNANCE',
        'companies.cpf3.title': 'Certificazione CPF3:2026',
        'companies.cpf3.description': 'Ottieni la certificazione che dimostra la tua resilienza psicologica oltre che tecnica. Sostituisci la falsa sicurezza della compliance cartacea (ISO standard) con la predizione attiva del rischio umano.',
        'companies.cpf3.dashboard.title': 'Dashboard & Matrice 10x10',
        'companies.cpf3.dashboard.description': 'Visualizza i 100 indicatori psicologici in tempo reale con punteggi semaforici (Verde/Giallo/Rosso).',
        'companies.cpf3.matrix.title': 'Matrice di Compilazione',
        'companies.cpf3.matrix.description': 'Template guidati per mappare policy aziendali e procedure HR sugli standard psicologici del framework.',
        'companies.cpf3.btn': 'Richiedi Assesment Aziendale',
        'companies.cpf3.why.title': 'Perché abbandonare i vecchi standard?',
        'companies.cpf3.why.description': 'Le certificazioni tradizionali (ISO 27001) guardano ai processi statici. Il CPF3:2026 guarda alle persone che li eseguono.',
        'companies.cpf3.old': 'Focus solo su Hardware/Software',
        'companies.cpf3.new1': 'Focus su Stress, Bias e Comportamento',
        'companies.cpf3.new2': 'Riduzione incidenti del 40% nel primo anno',
        'companies.cpf3.roi': 'ROI +200%',
        'companies.cpf3.roi.subtitle': 'Sull\'investimento in sicurezza',

        // Company Real Benefits
        'companies.real.title': 'Non solo burocrazia: Vantaggi Reali',
        'companies.real.legal.title': 'Protezione Legale',
        'companies.real.legal.description': 'La certificazione CertiCredia dimostra la "due diligence" nella gestione dei dati, offrendo uno scudo legale fondamentale in caso di data breach secondo le normative GDPR.',
        'companies.real.competitive.title': 'Vantaggio Competitivo',
        'companies.real.competitive.description': 'Entra nelle vendor list delle grandi multinazionali. La certificazione è sempre più un requisito bloccante per partecipare a gare d\'appalto pubbliche e private.',
        'companies.real.risk.title': 'Riduzione Rischi',
        'companies.real.risk.description': 'Riduci del 70% la probabilità di successo degli attacchi ransomware grazie all\'implementazione strutturata dei controlli di sicurezza previsti dal framework.',

        // Process Detailed
        'process.main.title': 'Il Nostro Metodo',
        'process.main.subtitle': 'Dall\'assesment alla certificazione in 4 step chiari.',
        'process.detailed.step1.title': 'Analisi Iniziale',
        'process.detailed.step1.description': 'Valutazione del perimetro e delle necessità, in autonomia o in collaborazione con un nostro specialist accreditato.',
        'process.detailed.step2.title': 'Onboarding Piattaforma',
        'process.detailed.step2.description': 'Accesso alla dashboard e caricamento della matrice documentale.',
        'process.detailed.step3.title': 'Validazione Assesment',
        'process.detailed.step3.description': 'I dati vengono analizzati e, se necessario, si attiva la procedura di integrazione.',
        'process.detailed.step4.title': 'Rilascio Certificazione',
        'process.detailed.step4.description': 'Emissione del certificato digitale crittografato e badge pubblico.',

        // Contact Form
        'contact.form.title': 'Centro Richieste',
        'contact.form.subtitle': 'Qui puoi compilare il form per richiedere informazioni.',
        'contact.form.company.btn': 'Sono un\'organizzazione',
        'contact.form.specialist.btn': 'Sono uno Specialista',
        'contact.form.name.label': 'Nome',
        'contact.form.name.placeholder': 'Mario Rossi',
        'contact.form.email.label': 'Email Organizzazione',
        'contact.form.email.placeholder': 'mario@azienda.it',
        'contact.form.company.label': 'Nome Organizzazione & P.IVA',
        'contact.form.linkedin.label': 'Link LinkedIn o CV',
        'contact.form.linkedin.placeholder': 'https://linkedin.com/in/...',
        'contact.form.message.label': 'Messaggio',
        'contact.form.message.placeholder': 'Come possiamo aiutarti?',
        'contact.form.submit.company': 'Richiedi Preventivo Certificazione',
        'contact.form.submit.specialist': 'Candidati come Specialist',
        'contact.form.privacy': 'Cliccando su invia accetti la nostra Privacy Policy. I tuoi dati sono trattati secondo GDPR.',

        // Footer Details
        'footer.company.description': 'Ente certificatore leader nella sicurezza informatica. Proteggiamo il presente per garantire il futuro.',
        'footer.certifications.title': 'Certificazioni',
        'footer.certifications.cpf3': 'CPF3:2026',
        'footer.certifications.nis2': 'NIS 2 Compliance',
        'footer.certifications.gdpr': 'GDPR Assesment',
        'footer.certifications.tisax': 'TISAX',
        'footer.company.title': 'Azienda',
        'footer.company.about': 'Chi Siamo',
        'footer.company.team': 'Il Nostro Team',
        'footer.company.careers': 'Lavora con Noi',
        'footer.company.blog': 'Blog',
        'footer.contacts.title': 'Contatti',
        'footer.contacts.email': 'info@certicredia.it',
        'footer.copyright.year': '© 2026 CertiCredia',

        // AI Chat Widget
        'chat.open.btn': 'Chiedi all\'AI',
        'chat.header.title': 'CertiCredia AI Assistant',
        'chat.welcome.message': 'Ciao! Sono l\'assistente virtuale di CertiCredia. Come posso aiutarti con le nostre certificazioni oggi?',
        'chat.input.placeholder': 'Chiedi su ISO 27001, costi...',
        'chat.disclaimer': 'L\'AI può commettere errori. Verifica le informazioni importanti.',

        // CPF3 Page
        'cpf3.hero.badge': 'Framework Psicologico per la Cybersecurity',
        'cpf3.hero.title1': 'Cybersecurity',
        'cpf3.hero.title2': 'Psychology Framework',
        'cpf3.hero.version': 'CPF3:2026',
        'cpf3.hero.description': 'Un cambio di paradigma nella cybersecurity che affronta i processi psicologici pre-cognitivi e inconsci che influenzano i comportamenti rilevanti per la sicurezza.',
        'cpf3.hero.btn.explore': 'Esplora il Framework Ufficiale',
        'cpf3.hero.btn.cert': 'Richiedi Certificazione CPF3',

        // CPF3 Overview
        'cpf3.overview.title': 'Cos\'è il CPF3?',
        'cpf3.overview.p1': 'Il <strong>Cybersecurity Psychology Framework (CPF)</strong> rappresenta un approccio rivoluzionario alla sicurezza informatica, andando oltre i tradizionali framework tecnici per affrontare il fattore umano nella cybersecurity.',
        'cpf3.overview.p2': 'Sviluppato da <strong>Giuseppe Canale, CISSP</strong>, il CPF integra psicologia cognitiva, psicoanalisi e neuroscienze per identificare e mitigare le vulnerabilità comportamentali che precedono la consapevolezza cosciente.',
        'cpf3.overview.p3': 'A differenza degli approcci basati esclusivamente sulla "security awareness", il CPF fornisce un modello completo per <strong>predire e prevenire i fallimenti di sicurezza</strong> prima che si verifichino, analizzando i processi decisionali pre-cognitivi.',
        'cpf3.info.title': 'Framework Ufficiale',
        'cpf3.info.author.label': 'Autore',
        'cpf3.info.author.value': 'Giuseppe Canale, CISSP',
        'cpf3.info.website.label': 'Sito Ufficiale',
        'cpf3.info.orcid.label': 'ORCID',

        // CPF3 Key Features
        'cpf3.feature1.title': 'Vulnerabilità Pre-Cognitive',
        'cpf3.feature1.description': 'Analisi dei processi decisionali che avvengono prima della consapevolezza cosciente, identificando i fattori di rischio invisibili.',
        'cpf3.feature2.title': 'Dinamiche Organizzative',
        'cpf3.feature2.description': 'Comprensione dei processi psicologici a livello di gruppo che influenzano la postura di sicurezza dell\'intera organizzazione.',
        'cpf3.feature3.title': '100+ Indicatori Comportamentali',
        'cpf3.feature3.description': 'Tassonomia completa con capacità di valutazione granulare per identificare specifiche vulnerabilità psicologiche.',

        // CPF3 10 Domains
        'cpf3.domains.title': 'I 10 Domini di Vulnerabilità Psicologica',
        'cpf3.domains.description': 'Il CPF identifica 10 domini principali, ciascuno contenente 10 indicatori specifici per un totale di 100 metriche di valutazione comportamentale.',
        'cpf3.domain1.title': 'Autorità e Obbedienza',
        'cpf3.domain1.description': 'Conformità inconscia alle strutture gerarchiche e alle figure di autorità.',
        'cpf3.domain1.category': 'Categoria 1.x | 10 indicatori',
        'cpf3.domain2.title': 'Fattori Temporali',
        'cpf3.domain2.description': 'Sfruttamento della pressione temporale, urgenza e scadenze per manipolare decisioni.',
        'cpf3.domain2.category': 'Categoria 2.x | 10 indicatori',
        'cpf3.domain3.title': 'Influenza Sociale',
        'cpf3.domain3.description': 'Pressione dei pari, reciprocità, prova sociale e dinamiche di gruppo.',
        'cpf3.domain3.category': 'Categoria 3.x | 10 indicatori',
        'cpf3.domain4.title': 'Affetto ed Emozione',
        'cpf3.domain4.description': 'Stati emozionali che influenzano il decision-making e la valutazione del rischio.',
        'cpf3.domain4.category': 'Categoria 4.x | 10 indicatori',
        'cpf3.domain5.title': 'Carico Cognitivo',
        'cpf3.domain5.description': 'Sovraccarico informativo, gestione dell\'attenzione e limiti della memoria di lavoro.',
        'cpf3.domain5.category': 'Categoria 5.x | 10 indicatori',
        'cpf3.domain6.title': 'Dinamiche di Gruppo',
        'cpf3.domain6.description': 'Comportamento collettivo, pensiero di gruppo e psicologia organizzativa.',
        'cpf3.domain6.category': 'Categoria 6.x | 10 indicatori',
        'cpf3.domain7.title': 'Risposta allo Stress',
        'cpf3.domain7.description': 'Risposte fight-flight-freeze-fawn e impatto dello stress acuto sulle decisioni.',
        'cpf3.domain7.category': 'Categoria 7.x | 10 indicatori',
        'cpf3.domain8.title': 'Processi Inconsci',
        'cpf3.domain8.description': 'Meccanismi di difesa, pattern inconsci e processi automatici di pensiero.',
        'cpf3.domain8.category': 'Categoria 8.x | 10 indicatori',
        'cpf3.domain9.title': 'Interazione con l\'IA',
        'cpf3.domain9.description': 'Dinamiche psicologiche specifiche dell\'interazione umano-IA e bias algoritmici.',
        'cpf3.domain9.category': 'Categoria 9.x | 10 indicatori',
        'cpf3.domain10.title': 'Complessità Sistemica',
        'cpf3.domain10.description': 'Effetti di emergenza, cascata e interazione non lineare tra vulnerabilità.',
        'cpf3.domain10.category': 'Categoria 10.x | 10 indicatori',

        // CPF3 Integration
        'cpf3.integration.title': 'Integrazione con Standard Esistenti',
        'cpf3.integration.description': 'Il CPF si integra perfettamente con i framework di sicurezza consolidati, fornendo la dimensione psicologica mancante.',
        'cpf3.integration.nist': 'Framework di Cybersecurity',
        'cpf3.integration.owasp': 'Top 10 Application Security',
        'cpf3.integration.nis2': 'Direttiva Europea',
        'cpf3.integration.dora': 'Digital Operational Resilience',
        'cpf3.integration.beyond.title': 'Oltre i Framework Tradizionali',
        'cpf3.integration.beyond.description': 'Mentre ISO 27001 e altri standard si concentrano su processi e tecnologie, il CPF3 aggiunge la dimensione umana critica: come le persone pensano, reagiscono e si comportano sotto pressione.',
        'cpf3.integration.beyond.bullet1': 'Predizione attiva del rischio umano',
        'cpf3.integration.beyond.bullet2': 'Misurazione quantitativa delle vulnerabilità psicologiche',
        'cpf3.integration.beyond.bullet3': 'Interventi mirati basati su evidenze scientifiche',
        'cpf3.integration.beyond.stat1': '40%',
        'cpf3.integration.beyond.stat1.text': 'Riduzione degli incidenti nel primo anno',
        'cpf3.integration.beyond.stat2': '+200%',
        'cpf3.integration.beyond.stat2.text': 'ROI sull\'investimento in sicurezza',

        // CPF3 CTA Section
        'cpf3.cta.title': 'Pronto a Implementare il CPF3?',
        'cpf3.cta.description': 'Scopri come il Cybersecurity Psychology Framework può trasformare la postura di sicurezza della tua organizzazione.',
        'cpf3.cta.btn.docs': 'Consulta la Documentazione',
        'cpf3.cta.btn.cert': 'Richiedi Certificazione',
        'cpf3.cta.contact.label': 'Informazioni e Collaborazioni',

        // Footer
        'footer.home': 'Home',
        'footer.specialists': 'Specialist',
        'footer.governance': 'Governance',
        'footer.cpf3': 'CPF3',
        'footer.copyright': '© 2026 CertiCredia',

        // Admin Panel
        'admin.label': 'ADMIN',
        'admin.nav.profile': 'Profilo',
        'admin.nav.logout': 'Logout',

        // Admin Sidebar
        'admin.sidebar.dashboard': 'Dashboard',
        'admin.sidebar.products': 'Prodotti',
        'admin.sidebar.orders': 'Ordini',
        'admin.sidebar.users': 'Utenti',
        'admin.sidebar.contacts': 'Contatti',
        'admin.sidebar.accreditation': 'Moduli Accreditamento',
        'admin.sidebar.organizations': 'Organizzazioni',
        'admin.sidebar.specialists': 'Specialist',
        'admin.sidebar.assessments': 'Assessments',

        // Admin Dashboard
        'admin.dashboard.title': 'Dashboard',
        'admin.dashboard.stats.products': 'Prodotti Totali',
        'admin.dashboard.stats.orders': 'Ordini Totali',
        'admin.dashboard.stats.users': 'Utenti Registrati',
        'admin.dashboard.stats.contacts': 'Contatti Ricevuti',
        'admin.dashboard.recent.orders': 'Ultimi Ordini',

        // Admin Products
        'admin.products.title': 'Gestione Prodotti',
        'admin.products.new': '+ Nuovo Prodotto',
        'admin.products.filter.name': 'Cerca per nome...',
        'admin.products.filter.category': 'Categoria...',
        'admin.products.filter.status': 'Tutti gli stati',
        'admin.products.filter.status.active': 'Attivo',
        'admin.products.filter.status.inactive': 'Inattivo',
        'admin.products.filter.reset': 'Reset Filtri',
        'admin.products.form.title.new': 'Nuovo Prodotto',
        'admin.products.form.title.edit': 'Modifica Prodotto',
        'admin.products.form.name': 'Nome',
        'admin.products.form.slug': 'Slug',
        'admin.products.form.shortdesc': 'Descrizione Breve',
        'admin.products.form.description': 'Descrizione Completa',
        'admin.products.form.price': 'Prezzo (€)',
        'admin.products.form.category': 'Categoria',
        'admin.products.form.duration': 'Durata (mesi)',
        'admin.products.form.save': 'Salva',
        'admin.products.form.cancel': 'Annulla',
        'admin.products.table.name': 'Nome',
        'admin.products.table.category': 'Categoria',
        'admin.products.table.price': 'Prezzo',
        'admin.products.table.status': 'Stato',
        'admin.products.table.actions': 'Azioni',

        // Admin Orders
        'admin.orders.title': 'Gestione Ordini',
        'admin.orders.filter.number': 'Cerca per numero ordine...',
        'admin.orders.filter.customer': 'Cliente...',
        'admin.orders.filter.status': 'Tutti gli stati',
        'admin.orders.filter.status.pending': 'In Attesa',
        'admin.orders.filter.status.confirmed': 'Confermato',
        'admin.orders.filter.status.processing': 'In Lavorazione',
        'admin.orders.filter.status.completed': 'Completato',
        'admin.orders.filter.status.cancelled': 'Annullato',
        'admin.orders.filter.reset': 'Reset Filtri',
        'admin.orders.table.number': 'N. Ordine',
        'admin.orders.table.customer': 'Cliente',
        'admin.orders.table.total': 'Totale',
        'admin.orders.table.status': 'Stato',
        'admin.orders.table.date': 'Data',
        'admin.orders.table.actions': 'Azioni',
        'admin.orders.modal.title': 'Dettagli Ordine',

        // Admin Users
        'admin.users.title': 'Gestione Utenti',
        'admin.users.filter.name': 'Cerca per nome o email...',
        'admin.users.filter.role': 'Tutti i ruoli',
        'admin.users.filter.role.admin': 'Admin',
        'admin.users.filter.role.user': 'Utente',
        'admin.users.filter.role.specialist': 'Specialist',
        'admin.users.filter.role.orgadmin': 'Org. Admin',
        'admin.users.filter.status': 'Tutti gli stati',
        'admin.users.filter.status.active': 'Attivo',
        'admin.users.filter.status.inactive': 'Inattivo',
        'admin.users.filter.reset': 'Reset Filtri',
        'admin.users.table.name': 'Nome',
        'admin.users.table.email': 'Email',
        'admin.users.table.role': 'Ruolo',
        'admin.users.table.registered': 'Registrato',
        'admin.users.table.status': 'Stato',
        'admin.users.table.actions': 'Azioni',

        // Admin Contacts
        'admin.contacts.title': 'Contatti Ricevuti',
        'admin.contacts.filter.name': 'Cerca per nome o email...',
        'admin.contacts.filter.type': 'Tutti i tipi',
        'admin.contacts.filter.type.company': 'Azienda',
        'admin.contacts.filter.type.specialist': 'Specialist',
        'admin.contacts.filter.status': 'Tutti gli stati',
        'admin.contacts.filter.status.new': 'Nuovo',
        'admin.contacts.filter.status.contacted': 'Contattato',
        'admin.contacts.filter.status.closed': 'Chiuso',
        'admin.contacts.filter.reset': 'Reset Filtri',
        'admin.contacts.table.name': 'Nome',
        'admin.contacts.table.email': 'Email',
        'admin.contacts.table.type': 'Tipo',
        'admin.contacts.table.message': 'Messaggio',
        'admin.contacts.table.date': 'Data',
        'admin.contacts.table.status': 'Stato',
        'admin.contacts.table.actions': 'Azioni',

        // Admin Organizations
        'admin.organizations.title': 'Gestione Organizzazioni',
        'admin.organizations.new': 'Nuova Organizzazione',
        'admin.organizations.filter.name': 'Cerca per nome...',
        'admin.organizations.filter.type': 'Tutti i tipi',
        'admin.organizations.filter.type.public': 'Ente Pubblico',
        'admin.organizations.filter.type.private': 'Azienda Privata',
        'admin.organizations.filter.type.nonprofit': 'No Profit',
        'admin.organizations.filter.status': 'Tutti gli stati',
        'admin.organizations.filter.status.pending': 'In attesa',
        'admin.organizations.filter.status.active': 'Attivo',
        'admin.organizations.filter.status.suspended': 'Sospeso',
        'admin.organizations.filter.status.inactive': 'Inattivo',
        'admin.organizations.filter.reset': 'Reset Filtri',
        'admin.organizations.table.name': 'Nome',
        'admin.organizations.table.type': 'Tipo',
        'admin.organizations.table.vat': 'P.IVA',
        'admin.organizations.table.city': 'Città',
        'admin.organizations.table.status': 'Stato',
        'admin.organizations.table.created': 'Creata',
        'admin.organizations.table.actions': 'Azioni',
        'admin.organizations.modal.title.new': 'Nuova Organizzazione',
        'admin.organizations.modal.title.edit': 'Modifica Organizzazione',
        'admin.organizations.form.name': 'Nome Organizzazione *',
        'admin.organizations.form.type': 'Tipo *',
        'admin.organizations.form.type.select': 'Seleziona tipo',
        'admin.organizations.form.type.public': 'Ente Pubblico',
        'admin.organizations.form.type.private': 'Azienda Privata',
        'admin.organizations.form.type.nonprofit': 'No Profit',
        'admin.organizations.form.email': 'Email *',
        'admin.organizations.form.phone': 'Telefono',
        'admin.organizations.form.vat': 'P.IVA',
        'admin.organizations.form.fiscal': 'Codice Fiscale',
        'admin.organizations.form.address': 'Indirizzo',
        'admin.organizations.form.city': 'Città',
        'admin.organizations.form.province': 'Provincia',
        'admin.organizations.form.postal': 'CAP',
        'admin.organizations.form.status': 'Stato',
        'admin.organizations.form.status.pending': 'In attesa',
        'admin.organizations.form.status.active': 'Attivo',
        'admin.organizations.form.status.suspended': 'Sospeso',
        'admin.organizations.form.status.inactive': 'Inattivo',
        'admin.organizations.form.save': 'Salva',
        'admin.organizations.form.cancel': 'Annulla',

        // Admin Specialists
        'admin.specialists.title': 'Gestione Specialist',
        'admin.specialists.new': 'Nuovo Specialist',
        'admin.specialists.filter.name': 'Cerca per nome o email...',
        'admin.specialists.filter.status': 'Tutti gli stati',
        'admin.specialists.filter.status.pending': 'Candidato',
        'admin.specialists.filter.status.certified': 'Certificato',
        'admin.specialists.filter.status.suspended': 'Sospeso',
        'admin.specialists.filter.status.expired': 'Scaduto',
        'admin.specialists.filter.reset': 'Reset Filtri',
        'admin.specialists.table.name': 'Nome',
        'admin.specialists.table.email': 'Email',
        'admin.specialists.table.experience': 'Esperienza',
        'admin.specialists.table.cpe': 'CPE',
        'admin.specialists.table.status': 'Stato',
        'admin.specialists.table.certified': 'Certificato',
        'admin.specialists.table.actions': 'Azioni',
        'admin.specialists.modal.title.new': 'Nuovo Specialist',
        'admin.specialists.modal.title.edit': 'Modifica Specialist',
        'admin.specialists.form.name': 'Nome *',
        'admin.specialists.form.email': 'Email *',
        'admin.specialists.form.experience': 'Anni di Esperienza *',
        'admin.specialists.form.status': 'Stato',
        'admin.specialists.form.status.pending': 'Candidato',
        'admin.specialists.form.status.certified': 'Certificato',
        'admin.specialists.form.status.suspended': 'Sospeso',
        'admin.specialists.form.status.expired': 'Scaduto',
        'admin.specialists.form.bio': 'Bio / Competenze',
        'admin.specialists.form.cpe': 'CPE Totali',
        'admin.specialists.form.certdate': 'Data Certificazione',
        'admin.specialists.form.save': 'Salva',
        'admin.specialists.form.cancel': 'Annulla',

        // Admin Assessments
        'admin.assessments.title': 'Gestione Assessments',
        'admin.assessments.description': 'Dashboard assessments disponibile su dominio esterno',
        'admin.assessments.card.title': 'Assessment Cybersecurity',
        'admin.assessments.card.description': 'Il sistema di assessment è gestito su una piattaforma dedicata',
        'admin.assessments.card.button': 'Apri Dashboard Assessment',
        'admin.assessments.stats.total': 'Assessments Totali',
        'admin.assessments.stats.inprogress': 'In Corso',
        'admin.assessments.stats.completed': 'Completati',

        // Shop Page
        'shop.nav.home': 'Home',
        'shop.nav.shop': 'Shop',
        'shop.title': 'Certificazioni Cybersecurity',
        'shop.description': 'Scegli la certificazione più adatta alle tue esigenze',
        'shop.loading': 'Caricamento prodotti...',
        'shop.empty': 'Nessun prodotto disponibile',
        'shop.addtocart': 'Aggiungi al Carrello',

        // Cart Page
        'cart.title': 'Il Tuo Carrello',
        'cart.empty': 'Il tuo carrello è vuoto',
        'cart.empty.shop': 'Vai allo Shop',
        'cart.subtotal': 'Subtotale',
        'cart.total': 'Totale',
        'cart.checkout': 'Procedi al Checkout',
        'cart.continue': 'Continua gli Acquisti',
        'cart.remove': 'Rimuovi',

        // Checkout Page
        'checkout.title': 'Finalizza Ordine',
        'checkout.backtocart': 'Torna al Carrello',
        'checkout.billing': 'Dati di Fatturazione',
        'checkout.summary': 'Riepilogo Ordine',
        'checkout.form.name': 'Nome e Cognome *',
        'checkout.form.email': 'Email *',
        'checkout.form.phone': 'Telefono *',
        'checkout.form.company': 'Azienda (opzionale)',
        'checkout.form.vat': 'Partita IVA',
        'checkout.form.address': 'Indirizzo *',
        'checkout.form.city': 'Città *',
        'checkout.form.postal': 'CAP *',
        'checkout.form.province': 'Provincia',
        'checkout.form.country': 'Paese',
        'checkout.form.payment': 'Metodo di Pagamento',
        'checkout.form.payment.transfer': 'Bonifico Bancario',
        'checkout.form.payment.card': 'Carta di Credito (prossimamente)',
        'checkout.form.notes': 'Note Ordine (opzionale)',
        'checkout.subtotal': 'Subtotale',
        'checkout.tax': 'IVA (22%)',
        'checkout.total': 'Totale',
        'checkout.submit': 'Completa Ordine',
        'checkout.cancel': 'Annulla',

        // Register Organization
        'register.org.back': '← Torna alla Home',
        'register.org.title': 'Registrazione Organizzazione',
        'register.org.subtitle': 'Crea il tuo account organizzazione per accedere al sistema di assessment',
        'register.org.section.data': 'Dati Organizzazione',
        'register.org.section.info': 'Informazioni Organizzazione',
        'register.org.section.responsible': 'Responsabile Account',
        'register.org.section.credentials': 'Credenziali Accesso',
        'register.org.type': 'Tipo Organizzazione *',
        'register.org.type.select': '-- Seleziona --',
        'register.org.type.public': 'Ente Pubblico',
        'register.org.type.private': 'Azienda Privata',
        'register.org.type.nonprofit': 'Organizzazione No Profit',
        'register.org.name': 'Nome Organizzazione *',
        'register.org.vat': 'Partita IVA',
        'register.org.fiscal': 'Codice Fiscale',
        'register.org.address': 'Indirizzo *',
        'register.org.city': 'Città *',
        'register.org.postal': 'CAP *',
        'register.org.email': 'Email Organizzazione *',
        'register.org.phone': 'Telefono',
        'register.org.contact.firstname': 'Nome Responsabile *',
        'register.org.contact.lastname': 'Cognome Responsabile *',
        'register.org.contact.email': 'Email Responsabile *',
        'register.org.contact.phone': 'Telefono Responsabile',
        'register.org.password': 'Password *',
        'register.org.password.hint': 'Minimo 12 caratteri, lettere maiuscole, minuscole, numeri e simboli',
        'register.org.password.confirm': 'Conferma Password *',
        'register.org.terms': 'Accetto i',
        'register.org.terms.link': 'Termini e Condizioni',
        'register.org.terms.and': 'e la',
        'register.org.privacy.link': 'Privacy Policy',
        'register.org.submit': 'Registra Organizzazione',
        'register.org.hasaccount': 'Hai già un account?',
        'register.org.login': 'Accedi',
        'register.org.specialist': 'Sei uno specialist?',
        'register.org.specialist.link': 'Registrati come Specialist',
        'register.org.info.title': 'Cosa succede dopo la registrazione?',
        'register.org.info.1': '✓ L\'account verrà verificato dal nostro team',
        'register.org.info.2': '✓ Riceverai una email di conferma',
        'register.org.info.3': '✓ Potrai accedere alla dashboard organizzazione',
        'register.org.info.4': '✓ Potrai richiedere un assessment cybersecurity',

        // Register Specialist
        'register.spec.back': '← Torna alla Home',
        'register.spec.title': 'Registrazione Specialist',
        'register.spec.subtitle': 'Candidati come Specialist CPF3 certificato',
        'register.spec.section.personal': 'Dati Personali',
        'register.spec.section.professional': 'Esperienza Professionale',
        'register.spec.section.credentials': 'Credenziali Accesso',
        'register.spec.firstname': 'Nome *',
        'register.spec.lastname': 'Cognome *',
        'register.spec.email': 'Email *',
        'register.spec.phone': 'Telefono',
        'register.spec.experience': 'Anni di Esperienza *',
        'register.spec.certifications': 'Certificazioni (opzionale)',
        'register.spec.bio': 'Bio / Competenze',
        'register.spec.password': 'Password *',
        'register.spec.password.confirm': 'Conferma Password *',
        'register.spec.terms': 'Accetto i',
        'register.spec.submit': 'Candidati come Specialist',
        'register.spec.hasaccount': 'Hai già un account?',
        'register.spec.organization': 'Sei un\'organizzazione?',
        'register.spec.organization.link': 'Registrati come Organizzazione',
    },
    'en-US': {
        // Navbar
        'nav.home': 'Home',
        'nav.specialists': 'Specialists',
        'nav.companies': 'Governance',
        'nav.process': 'Methodology',
        'nav.contact': 'Contact',
        'nav.shop': 'Shop',
        'nav.cpf3': 'CPF3 Framework',
        'nav.app': 'Management Area',

        // Hero Section
        'hero.badge': 'New Cybersecurity Framework 2026',
        'hero.title1': 'Security is not an option.',
        'hero.title2': 'It\'s a Certification.',
        'hero.description': 'CertiCredia is the strategic partner for specialists who want to excel and organizations that demand compliance. A unique cybersecurity ecosystem.',
        'hero.btn.specialists': 'For Specialists',
        'hero.btn.companies': 'For Governance',

        // Stats
        'stats.orgs': 'Certified Organizations',
        'stats.specialists': 'Active Specialists',
        'stats.compliance': 'Compliance',
        'stats.support': 'Support',

        // Specialists Section 1
        'specialists.badge': 'FOR SPECIALISTS',
        'specialists.title': 'Become an Excellence Specialist',
        'specialists.description': 'We provide you with the tools to become the trusted specialist every organization seeks. Get authorized to use our proprietary suite.',
        'specialists.feature1': 'CertiCredia Lead Specialist Certification',
        'specialists.feature2': 'Access to the exclusive assessment platform',
        'specialists.feature3': 'Network of partner organizations seeking specialists',
        'specialists.feature4': 'Continuous training on new attack vectors',
        'specialists.btn': 'Apply Now',

        // Specialists Benefits
        'benefits.title': 'Why choose the CertiCredia path?',
        'benefits.description': 'Becoming a specialist is not the goal, it\'s the beginning of your professional ascent.',
        'benefits.card1.title': 'Innovative Role',
        'benefits.card1.description': 'CertiCredia accredited specialists access an innovative market with exponential demand growth.',
        'benefits.card2.title': 'Exclusive Community',
        'benefits.card2.description': 'Access to private digital channels to improve your knowledge and professional network.',
        'benefits.card3.title': 'Incident Response',
        'benefits.card3.description': 'Participate as an auxiliary resource in our enterprise clients\' critical incident response teams.',

        // Specialists Section 2
        'specialists2.title': 'CertiCredia Accredited Specialist',
        'specialists2.description': 'Organizations seek professionals who go beyond the technical checklist. CertiCredia accreditation enables you to use the CPF3 psychological framework to support organizations.',
        'specialists2.feature1.title': 'Specialist Accreditation',
        'specialists2.feature1.description': 'Get registered in the registry of specialists authorized for pre-cognitive analysis.',
        'specialists2.feature2.title': 'Framework Access',
        'specialists2.feature2.description': 'Exclusive material on psychological indicators and access to assessment tools.',
        'specialists2.requirements': 'Requirements:',
        'specialists2.req1': 'Previous experience in IT/Cybersecurity or Work Psychology, or CPF3 training path.',
        'specialists2.req2': 'Passing the CPF3 final exam.',
        'specialists2.btn': 'Request Information',

        // Specialist Kit
        'kit.title': 'The Specialist Kit',
        'kit.item1': 'CPF3:2026 Operational Manual',
        'kit.item2': 'CPF3 Assessment Dashboard Access',
        'kit.item3': 'Constantly Updated Information Material',
        'kit.item4': 'Continuous Training',

        // Career Path
        'career.title': 'Specialist Accreditation Path',
        'career.description': 'Become a strategic consultant: increase your market value.',
        'career.step1.title': 'Training',
        'career.step1.description': 'Intensive course on cognitive psychology and cybersecurity.',
        'career.step2.title': 'Accreditation',
        'career.step2.description': 'Theoretical-practical exam and CPF3 Specialist badge release.',
        'career.step3.title': 'Specialist',
        'career.step3.description': 'Advanced training on CPF3 operational tools.',

        // Companies Section
        'companies.badge': 'FOR GOVERNANCE',
        'companies.title': 'Compliance that Truly Protects',
        'companies.description': 'A checklist is not enough. Cybersecurity requires understanding, strategy, and qualified specialists. CertiCredia is the official partner for organizations that want to transform compliance into a competitive advantage.',
        'companies.feature1': 'CPF3 Assessment - Psychological framework for cybersecurity',
        'companies.feature2': 'Compliance certification aligned with NIS2, DORA, ISO27001',
        'companies.feature3': 'Real-time dashboard to monitor security status',
        'companies.feature4': 'Access to certified specialists for interventions and training',
        'companies.btn': 'Request Demo',

        // Companies Benefits
        'companies.benefits.title': 'Benefits for your organization',
        'companies.benefits.card1.title': 'Risk Reduction',
        'companies.benefits.card1.description': 'Identify behavioral vulnerabilities before they are exploited.',
        'companies.benefits.card2.title': 'Simplified Compliance',
        'companies.benefits.card2.description': 'A single framework covering NIS2, DORA, and ISO27001.',
        'companies.benefits.card3.title': 'Measurable ROI',
        'companies.benefits.card3.description': 'Advanced dashboards to demonstrate security posture effectiveness.',

        // Process Section
        'process.title': 'How It Works',
        'process.description': 'A structured 4-phase process to ensure maximum effectiveness',
        'process.step1.title': 'Initial Assessment',
        'process.step1.description': 'In-depth analysis of organizational context and behavioral vulnerabilities',
        'process.step2.title': 'Action Plan',
        'process.step2.description': 'Definition of personalized strategies based on the CPF3 framework',
        'process.step3.title': 'Implementation',
        'process.step3.description': 'Guided deployment with personnel and specialist training',
        'process.step4.title': 'Certification',
        'process.step4.description': 'Validation and certification release with continuous monitoring',

        // Contact Section
        'contact.badge': 'START NOW',
        'contact.title': 'Have Questions?',
        'contact.description': 'Our team is ready to help you start your CertiCredia journey',
        'contact.email.label': 'Email',
        'contact.email.placeholder': 'your@email.com',
        'contact.message.label': 'Message',
        'contact.message.placeholder': 'Tell us about your needs...',
        'contact.btn': 'Send Request',
        'contact.alternative': 'Or write to us directly at',

        // Footer
        'footer.description': 'The strategic partner for organizations and specialists in modern cybersecurity.',
        'footer.links': 'Quick Links',
        'footer.link.about': 'About Us',
        'footer.link.specialists': 'For Specialists',
        'footer.link.companies': 'For Organizations',
        'footer.link.docs': 'Documentation',
        'footer.resources': 'Resources',
        'footer.link.blog': 'Blog',
        'footer.link.faq': 'FAQ',
        'footer.link.support': 'Support',
        'footer.link.privacy': 'Privacy Policy',
        'footer.legal': 'Legal',
        'footer.link.terms': 'Terms of Service',
        'footer.link.cookie': 'Cookie Policy',
        'footer.copyright': '© 2024 CertiCredia. All rights reserved.',

        // Companies Detailed Section
        'companies.gov.badge': 'GOVERNANCE',
        'companies.gov.title': 'Security Governance, Simplified',
        'companies.gov.description': 'Our ecosystem allows you to improve cybersecurity maturity and cybersecurity governance strategy.',
        'companies.dashboard.title': 'Compliance Dashboard',
        'companies.dashboard.description': 'View your security level in real-time and monitor gaps.',
        'companies.matrix.title': 'Compilation Matrix',
        'companies.matrix.description': 'Pre-filled and guided assessment templates.',
        'companies.demo.btn': 'Request Dashboard Demo',

        // Companies CPF3 Section
        'companies.cpf3.badge': 'FOR GOVERNANCE',
        'companies.cpf3.title': 'CPF3:2026 Certification',
        'companies.cpf3.description': 'Obtain certification that demonstrates your psychological resilience beyond just technical capability. Replace the false security of paper compliance (ISO standards) with active prediction of human risk.',
        'companies.cpf3.dashboard.title': 'Dashboard & 10x10 Matrix',
        'companies.cpf3.dashboard.description': 'View 100 psychological indicators in real-time with traffic light scoring (Green/Yellow/Red).',
        'companies.cpf3.matrix.title': 'Compilation Matrix',
        'companies.cpf3.matrix.description': 'Guided templates to map company policies and HR procedures to framework psychological standards.',
        'companies.cpf3.btn': 'Request Company Assessment',
        'companies.cpf3.why.title': 'Why abandon old standards?',
        'companies.cpf3.why.description': 'Traditional certifications (ISO 27001) look at static processes. CPF3:2026 looks at the people who execute them.',
        'companies.cpf3.old': 'Focus only on Hardware/Software',
        'companies.cpf3.new1': 'Focus on Stress, Bias and Behavior',
        'companies.cpf3.new2': '40% incident reduction in the first year',
        'companies.cpf3.roi': 'ROI +200%',
        'companies.cpf3.roi.subtitle': 'On security investment',

        // Company Real Benefits
        'companies.real.title': 'Not just bureaucracy: Real Benefits',
        'companies.real.legal.title': 'Legal Protection',
        'companies.real.legal.description': 'CertiCredia certification demonstrates "due diligence" in data management, providing a fundamental legal shield in case of data breach according to GDPR regulations.',
        'companies.real.competitive.title': 'Competitive Advantage',
        'companies.real.competitive.description': 'Enter the vendor lists of large multinationals. Certification is increasingly a blocking requirement to participate in public and private tenders.',
        'companies.real.risk.title': 'Risk Reduction',
        'companies.real.risk.description': 'Reduce the probability of successful ransomware attacks by 70% thanks to structured implementation of security controls provided by the framework.',

        // Process Detailed
        'process.main.title': 'Our Method',
        'process.main.subtitle': 'From assessment to certification in 4 clear steps.',
        'process.detailed.step1.title': 'Initial Analysis',
        'process.detailed.step1.description': 'Perimeter and needs assessment, independently or in collaboration with our accredited specialist.',
        'process.detailed.step2.title': 'Platform Onboarding',
        'process.detailed.step2.description': 'Access to dashboard and uploading of document matrix.',
        'process.detailed.step3.title': 'Assessment Validation',
        'process.detailed.step3.description': 'Data is analyzed and, if necessary, the integration procedure is activated.',
        'process.detailed.step4.title': 'Certification Release',
        'process.detailed.step4.description': 'Issuance of encrypted digital certificate and public badge.',

        // Contact Form
        'contact.form.title': 'Request Center',
        'contact.form.subtitle': 'Here you can fill out the form to request information.',
        'contact.form.company.btn': 'I\'m an organization',
        'contact.form.specialist.btn': 'I\'m a Specialist',
        'contact.form.name.label': 'Name',
        'contact.form.name.placeholder': 'John Doe',
        'contact.form.email.label': 'Organization Email',
        'contact.form.email.placeholder': 'john@company.com',
        'contact.form.company.label': 'Organization Name & Tax ID',
        'contact.form.linkedin.label': 'LinkedIn Link or CV',
        'contact.form.linkedin.placeholder': 'https://linkedin.com/in/...',
        'contact.form.message.label': 'Message',
        'contact.form.message.placeholder': 'How can we help you?',
        'contact.form.submit.company': 'Request Certification Quote',
        'contact.form.submit.specialist': 'Apply as Specialist',
        'contact.form.privacy': 'By clicking send you accept our Privacy Policy. Your data is processed according to GDPR.',

        // Footer Details
        'footer.company.description': 'Leading certification body in information security. We protect the present to guarantee the future.',
        'footer.certifications.title': 'Certifications',
        'footer.certifications.cpf3': 'CPF3:2026',
        'footer.certifications.nis2': 'NIS 2 Compliance',
        'footer.certifications.gdpr': 'GDPR Assessment',
        'footer.certifications.tisax': 'TISAX',
        'footer.company.title': 'Company',
        'footer.company.about': 'About Us',
        'footer.company.team': 'Our Team',
        'footer.company.careers': 'Work With Us',
        'footer.company.blog': 'Blog',
        'footer.contacts.title': 'Contacts',
        'footer.contacts.email': 'info@certicredia.it',
        'footer.copyright.year': '© 2026 CertiCredia',

        // AI Chat Widget
        'chat.open.btn': 'Ask AI',
        'chat.header.title': 'CertiCredia AI Assistant',
        'chat.welcome.message': 'Hello! I\'m the CertiCredia virtual assistant. How can I help you with our certifications today?',
        'chat.input.placeholder': 'Ask about ISO 27001, costs...',
        'chat.disclaimer': 'AI can make mistakes. Verify important information.',

        // CPF3 Page
        'cpf3.hero.badge': 'Psychological Framework for Cybersecurity',
        'cpf3.hero.title1': 'Cybersecurity',
        'cpf3.hero.title2': 'Psychology Framework',
        'cpf3.hero.version': 'CPF3:2026',
        'cpf3.hero.description': 'A paradigm shift in cybersecurity that addresses pre-cognitive and unconscious psychological processes influencing security-relevant behaviors.',
        'cpf3.hero.btn.explore': 'Explore the Official Framework',
        'cpf3.hero.btn.cert': 'Request CPF3 Certification',

        // CPF3 Overview
        'cpf3.overview.title': 'What is CPF3?',
        'cpf3.overview.p1': 'The <strong>Cybersecurity Psychology Framework (CPF)</strong> represents a revolutionary approach to information security, going beyond traditional technical frameworks to address the human factor in cybersecurity.',
        'cpf3.overview.p2': 'Developed by <strong>Giuseppe Canale, CISSP</strong>, CPF integrates cognitive psychology, psychoanalysis, and neuroscience to identify and mitigate behavioral vulnerabilities that precede conscious awareness.',
        'cpf3.overview.p3': 'Unlike approaches based solely on "security awareness", CPF provides a comprehensive model to <strong>predict and prevent security failures</strong> before they occur, analyzing pre-cognitive decision-making processes.',
        'cpf3.info.title': 'Official Framework',
        'cpf3.info.author.label': 'Author',
        'cpf3.info.author.value': 'Giuseppe Canale, CISSP',
        'cpf3.info.website.label': 'Official Website',
        'cpf3.info.orcid.label': 'ORCID',

        // CPF3 Key Features
        'cpf3.feature1.title': 'Pre-Cognitive Vulnerabilities',
        'cpf3.feature1.description': 'Analysis of decision-making processes that occur before conscious awareness, identifying invisible risk factors.',
        'cpf3.feature2.title': 'Organizational Dynamics',
        'cpf3.feature2.description': 'Understanding of group-level psychological processes that influence the entire organization\'s security posture.',
        'cpf3.feature3.title': '100+ Behavioral Indicators',
        'cpf3.feature3.description': 'Comprehensive taxonomy with granular assessment capabilities to identify specific psychological vulnerabilities.',

        // CPF3 10 Domains
        'cpf3.domains.title': 'The 10 Domains of Psychological Vulnerability',
        'cpf3.domains.description': 'CPF identifies 10 main domains, each containing 10 specific indicators for a total of 100 behavioral assessment metrics.',
        'cpf3.domain1.title': 'Authority and Obedience',
        'cpf3.domain1.description': 'Unconscious conformity to hierarchical structures and authority figures.',
        'cpf3.domain1.category': 'Category 1.x | 10 indicators',
        'cpf3.domain2.title': 'Temporal Factors',
        'cpf3.domain2.description': 'Exploitation of time pressure, urgency, and deadlines to manipulate decisions.',
        'cpf3.domain2.category': 'Category 2.x | 10 indicators',
        'cpf3.domain3.title': 'Social Influence',
        'cpf3.domain3.description': 'Peer pressure, reciprocity, social proof, and group dynamics.',
        'cpf3.domain3.category': 'Category 3.x | 10 indicators',
        'cpf3.domain4.title': 'Affect and Emotion',
        'cpf3.domain4.description': 'Emotional states that influence decision-making and risk assessment.',
        'cpf3.domain4.category': 'Category 4.x | 10 indicators',
        'cpf3.domain5.title': 'Cognitive Load',
        'cpf3.domain5.description': 'Information overload, attention management, and working memory limitations.',
        'cpf3.domain5.category': 'Category 5.x | 10 indicators',
        'cpf3.domain6.title': 'Group Dynamics',
        'cpf3.domain6.description': 'Collective behavior, groupthink, and organizational psychology.',
        'cpf3.domain6.category': 'Category 6.x | 10 indicators',
        'cpf3.domain7.title': 'Stress Response',
        'cpf3.domain7.description': 'Fight-flight-freeze-fawn responses and acute stress impact on decisions.',
        'cpf3.domain7.category': 'Category 7.x | 10 indicators',
        'cpf3.domain8.title': 'Unconscious Processes',
        'cpf3.domain8.description': 'Defense mechanisms, unconscious patterns, and automatic thinking processes.',
        'cpf3.domain8.category': 'Category 8.x | 10 indicators',
        'cpf3.domain9.title': 'AI Interaction',
        'cpf3.domain9.description': 'Psychological dynamics specific to human-AI interaction and algorithmic biases.',
        'cpf3.domain9.category': 'Category 9.x | 10 indicators',
        'cpf3.domain10.title': 'Systemic Complexity',
        'cpf3.domain10.description': 'Emergent effects, cascade, and non-linear interaction between vulnerabilities.',
        'cpf3.domain10.category': 'Category 10.x | 10 indicators',

        // CPF3 Integration
        'cpf3.integration.title': 'Integration with Existing Standards',
        'cpf3.integration.description': 'CPF integrates seamlessly with established security frameworks, providing the missing psychological dimension.',
        'cpf3.integration.nist': 'Cybersecurity Framework',
        'cpf3.integration.owasp': 'Top 10 Application Security',
        'cpf3.integration.nis2': 'European Directive',
        'cpf3.integration.dora': 'Digital Operational Resilience',
        'cpf3.integration.beyond.title': 'Beyond Traditional Frameworks',
        'cpf3.integration.beyond.description': 'While ISO 27001 and other standards focus on processes and technologies, CPF3 adds the critical human dimension: how people think, react, and behave under pressure.',
        'cpf3.integration.beyond.bullet1': 'Active prediction of human risk',
        'cpf3.integration.beyond.bullet2': 'Quantitative measurement of psychological vulnerabilities',
        'cpf3.integration.beyond.bullet3': 'Targeted interventions based on scientific evidence',
        'cpf3.integration.beyond.stat1': '40%',
        'cpf3.integration.beyond.stat1.text': 'Reduction in incidents in the first year',
        'cpf3.integration.beyond.stat2': '+200%',
        'cpf3.integration.beyond.stat2.text': 'ROI on security investment',

        // CPF3 CTA Section
        'cpf3.cta.title': 'Ready to Implement CPF3?',
        'cpf3.cta.description': 'Discover how the Cybersecurity Psychology Framework can transform your organization\'s security posture.',
        'cpf3.cta.btn.docs': 'View Documentation',
        'cpf3.cta.btn.cert': 'Request Certification',
        'cpf3.cta.contact.label': 'Information and Collaborations',

        // Footer
        'footer.home': 'Home',
        'footer.specialists': 'Specialists',
        'footer.governance': 'Governance',
        'footer.cpf3': 'CPF3',
        'footer.copyright': '© 2026 CertiCredia',

        // Admin Panel
        'admin.label': 'ADMIN',
        'admin.nav.profile': 'Profile',
        'admin.nav.logout': 'Logout',

        // Admin Sidebar
        'admin.sidebar.dashboard': 'Dashboard',
        'admin.sidebar.products': 'Products',
        'admin.sidebar.orders': 'Orders',
        'admin.sidebar.users': 'Users',
        'admin.sidebar.contacts': 'Contacts',
        'admin.sidebar.accreditation': 'Accreditation Modules',
        'admin.sidebar.organizations': 'Organizations',
        'admin.sidebar.specialists': 'Specialists',
        'admin.sidebar.assessments': 'Assessments',

        // Admin Dashboard
        'admin.dashboard.title': 'Dashboard',
        'admin.dashboard.stats.products': 'Total Products',
        'admin.dashboard.stats.orders': 'Total Orders',
        'admin.dashboard.stats.users': 'Registered Users',
        'admin.dashboard.stats.contacts': 'Received Contacts',
        'admin.dashboard.recent.orders': 'Recent Orders',

        // Admin Products
        'admin.products.title': 'Product Management',
        'admin.products.new': '+ New Product',
        'admin.products.filter.name': 'Search by name...',
        'admin.products.filter.category': 'Category...',
        'admin.products.filter.status': 'All statuses',
        'admin.products.filter.status.active': 'Active',
        'admin.products.filter.status.inactive': 'Inactive',
        'admin.products.filter.reset': 'Reset Filters',
        'admin.products.form.title.new': 'New Product',
        'admin.products.form.title.edit': 'Edit Product',
        'admin.products.form.name': 'Name',
        'admin.products.form.slug': 'Slug',
        'admin.products.form.shortdesc': 'Short Description',
        'admin.products.form.description': 'Full Description',
        'admin.products.form.price': 'Price (€)',
        'admin.products.form.category': 'Category',
        'admin.products.form.duration': 'Duration (months)',
        'admin.products.form.save': 'Save',
        'admin.products.form.cancel': 'Cancel',
        'admin.products.table.name': 'Name',
        'admin.products.table.category': 'Category',
        'admin.products.table.price': 'Price',
        'admin.products.table.status': 'Status',
        'admin.products.table.actions': 'Actions',

        // Admin Orders
        'admin.orders.title': 'Order Management',
        'admin.orders.filter.number': 'Search by order number...',
        'admin.orders.filter.customer': 'Customer...',
        'admin.orders.filter.status': 'All statuses',
        'admin.orders.filter.status.pending': 'Pending',
        'admin.orders.filter.status.confirmed': 'Confirmed',
        'admin.orders.filter.status.processing': 'Processing',
        'admin.orders.filter.status.completed': 'Completed',
        'admin.orders.filter.status.cancelled': 'Cancelled',
        'admin.orders.filter.reset': 'Reset Filters',
        'admin.orders.table.number': 'Order No.',
        'admin.orders.table.customer': 'Customer',
        'admin.orders.table.total': 'Total',
        'admin.orders.table.status': 'Status',
        'admin.orders.table.date': 'Date',
        'admin.orders.table.actions': 'Actions',
        'admin.orders.modal.title': 'Order Details',

        // Admin Users
        'admin.users.title': 'User Management',
        'admin.users.filter.name': 'Search by name or email...',
        'admin.users.filter.role': 'All roles',
        'admin.users.filter.role.admin': 'Admin',
        'admin.users.filter.role.user': 'User',
        'admin.users.filter.role.specialist': 'Specialist',
        'admin.users.filter.role.orgadmin': 'Org. Admin',
        'admin.users.filter.status': 'All statuses',
        'admin.users.filter.status.active': 'Active',
        'admin.users.filter.status.inactive': 'Inactive',
        'admin.users.filter.reset': 'Reset Filters',
        'admin.users.table.name': 'Name',
        'admin.users.table.email': 'Email',
        'admin.users.table.role': 'Role',
        'admin.users.table.registered': 'Registered',
        'admin.users.table.status': 'Status',
        'admin.users.table.actions': 'Actions',

        // Admin Contacts
        'admin.contacts.title': 'Received Contacts',
        'admin.contacts.filter.name': 'Search by name or email...',
        'admin.contacts.filter.type': 'All types',
        'admin.contacts.filter.type.company': 'Company',
        'admin.contacts.filter.type.specialist': 'Specialist',
        'admin.contacts.filter.status': 'All statuses',
        'admin.contacts.filter.status.new': 'New',
        'admin.contacts.filter.status.contacted': 'Contacted',
        'admin.contacts.filter.status.closed': 'Closed',
        'admin.contacts.filter.reset': 'Reset Filters',
        'admin.contacts.table.name': 'Name',
        'admin.contacts.table.email': 'Email',
        'admin.contacts.table.type': 'Type',
        'admin.contacts.table.message': 'Message',
        'admin.contacts.table.date': 'Date',
        'admin.contacts.table.status': 'Status',
        'admin.contacts.table.actions': 'Actions',

        // Admin Organizations
        'admin.organizations.title': 'Organization Management',
        'admin.organizations.new': 'New Organization',
        'admin.organizations.filter.name': 'Search by name...',
        'admin.organizations.filter.type': 'All types',
        'admin.organizations.filter.type.public': 'Public Entity',
        'admin.organizations.filter.type.private': 'Private Company',
        'admin.organizations.filter.type.nonprofit': 'Non-Profit',
        'admin.organizations.filter.status': 'All statuses',
        'admin.organizations.filter.status.pending': 'Pending',
        'admin.organizations.filter.status.active': 'Active',
        'admin.organizations.filter.status.suspended': 'Suspended',
        'admin.organizations.filter.status.inactive': 'Inactive',
        'admin.organizations.filter.reset': 'Reset Filters',
        'admin.organizations.table.name': 'Name',
        'admin.organizations.table.type': 'Type',
        'admin.organizations.table.vat': 'VAT',
        'admin.organizations.table.city': 'City',
        'admin.organizations.table.status': 'Status',
        'admin.organizations.table.created': 'Created',
        'admin.organizations.table.actions': 'Actions',
        'admin.organizations.modal.title.new': 'New Organization',
        'admin.organizations.modal.title.edit': 'Edit Organization',
        'admin.organizations.form.name': 'Organization Name *',
        'admin.organizations.form.type': 'Type *',
        'admin.organizations.form.type.select': 'Select type',
        'admin.organizations.form.type.public': 'Public Entity',
        'admin.organizations.form.type.private': 'Private Company',
        'admin.organizations.form.type.nonprofit': 'Non-Profit',
        'admin.organizations.form.email': 'Email *',
        'admin.organizations.form.phone': 'Phone',
        'admin.organizations.form.vat': 'VAT',
        'admin.organizations.form.fiscal': 'Tax Code',
        'admin.organizations.form.address': 'Address',
        'admin.organizations.form.city': 'City',
        'admin.organizations.form.province': 'Province',
        'admin.organizations.form.postal': 'Postal Code',
        'admin.organizations.form.status': 'Status',
        'admin.organizations.form.status.pending': 'Pending',
        'admin.organizations.form.status.active': 'Active',
        'admin.organizations.form.status.suspended': 'Suspended',
        'admin.organizations.form.status.inactive': 'Inactive',
        'admin.organizations.form.save': 'Save',
        'admin.organizations.form.cancel': 'Cancel',

        // Admin Specialists
        'admin.specialists.title': 'Specialist Management',
        'admin.specialists.new': 'New Specialist',
        'admin.specialists.filter.name': 'Search by name or email...',
        'admin.specialists.filter.status': 'All statuses',
        'admin.specialists.filter.status.pending': 'Candidate',
        'admin.specialists.filter.status.certified': 'Certified',
        'admin.specialists.filter.status.suspended': 'Suspended',
        'admin.specialists.filter.status.expired': 'Expired',
        'admin.specialists.filter.reset': 'Reset Filters',
        'admin.specialists.table.name': 'Name',
        'admin.specialists.table.email': 'Email',
        'admin.specialists.table.experience': 'Experience',
        'admin.specialists.table.cpe': 'CPE',
        'admin.specialists.table.status': 'Status',
        'admin.specialists.table.certified': 'Certified',
        'admin.specialists.table.actions': 'Actions',
        'admin.specialists.modal.title.new': 'New Specialist',
        'admin.specialists.modal.title.edit': 'Edit Specialist',
        'admin.specialists.form.name': 'Name *',
        'admin.specialists.form.email': 'Email *',
        'admin.specialists.form.experience': 'Years of Experience *',
        'admin.specialists.form.status': 'Status',
        'admin.specialists.form.status.pending': 'Candidate',
        'admin.specialists.form.status.certified': 'Certified',
        'admin.specialists.form.status.suspended': 'Suspended',
        'admin.specialists.form.status.expired': 'Expired',
        'admin.specialists.form.bio': 'Bio / Skills',
        'admin.specialists.form.cpe': 'Total CPE',
        'admin.specialists.form.certdate': 'Certification Date',
        'admin.specialists.form.save': 'Save',
        'admin.specialists.form.cancel': 'Cancel',

        // Admin Assessments
        'admin.assessments.title': 'Assessment Management',
        'admin.assessments.description': 'Assessment dashboard available on external domain',
        'admin.assessments.card.title': 'Cybersecurity Assessment',
        'admin.assessments.card.description': 'The assessment system is managed on a dedicated platform',
        'admin.assessments.card.button': 'Open Assessment Dashboard',
        'admin.assessments.stats.total': 'Total Assessments',
        'admin.assessments.stats.inprogress': 'In Progress',
        'admin.assessments.stats.completed': 'Completed',

        // Shop Page
        'shop.nav.home': 'Home',
        'shop.nav.shop': 'Shop',
        'shop.title': 'Cybersecurity Certifications',
        'shop.description': 'Choose the certification that best suits your needs',
        'shop.loading': 'Loading products...',
        'shop.empty': 'No products available',
        'shop.addtocart': 'Add to Cart',

        // Cart Page
        'cart.title': 'Your Cart',
        'cart.empty': 'Your cart is empty',
        'cart.empty.shop': 'Go to Shop',
        'cart.subtotal': 'Subtotal',
        'cart.total': 'Total',
        'cart.checkout': 'Proceed to Checkout',
        'cart.continue': 'Continue Shopping',
        'cart.remove': 'Remove',

        // Checkout Page
        'checkout.title': 'Complete Order',
        'checkout.backtocart': 'Back to Cart',
        'checkout.billing': 'Billing Information',
        'checkout.summary': 'Order Summary',
        'checkout.form.name': 'Full Name *',
        'checkout.form.email': 'Email *',
        'checkout.form.phone': 'Phone *',
        'checkout.form.company': 'Company (optional)',
        'checkout.form.vat': 'VAT Number',
        'checkout.form.address': 'Address *',
        'checkout.form.city': 'City *',
        'checkout.form.postal': 'Postal Code *',
        'checkout.form.province': 'Province/State',
        'checkout.form.country': 'Country',
        'checkout.form.payment': 'Payment Method',
        'checkout.form.payment.transfer': 'Bank Transfer',
        'checkout.form.payment.card': 'Credit Card (coming soon)',
        'checkout.form.notes': 'Order Notes (optional)',
        'checkout.subtotal': 'Subtotal',
        'checkout.tax': 'VAT (22%)',
        'checkout.total': 'Total',
        'checkout.submit': 'Complete Order',
        'checkout.cancel': 'Cancel',

        // Register Organization
        'register.org.back': '← Back to Home',
        'register.org.title': 'Organization Registration',
        'register.org.subtitle': 'Create your organization account to access the assessment system',
        'register.org.section.data': 'Organization Data',
        'register.org.section.info': 'Organization Information',
        'register.org.section.responsible': 'Account Manager',
        'register.org.section.credentials': 'Access Credentials',
        'register.org.type': 'Organization Type *',
        'register.org.type.select': '-- Select --',
        'register.org.type.public': 'Public Entity',
        'register.org.type.private': 'Private Company',
        'register.org.type.nonprofit': 'Non-Profit Organization',
        'register.org.name': 'Organization Name *',
        'register.org.vat': 'VAT Number',
        'register.org.fiscal': 'Tax Code',
        'register.org.address': 'Address *',
        'register.org.city': 'City *',
        'register.org.postal': 'Postal Code *',
        'register.org.email': 'Organization Email *',
        'register.org.phone': 'Phone',
        'register.org.contact.firstname': 'Manager First Name *',
        'register.org.contact.lastname': 'Manager Last Name *',
        'register.org.contact.email': 'Manager Email *',
        'register.org.contact.phone': 'Manager Phone',
        'register.org.password': 'Password *',
        'register.org.password.hint': 'Minimum 12 characters, uppercase, lowercase, numbers and symbols',
        'register.org.password.confirm': 'Confirm Password *',
        'register.org.terms': 'I accept the',
        'register.org.terms.link': 'Terms and Conditions',
        'register.org.terms.and': 'and the',
        'register.org.privacy.link': 'Privacy Policy',
        'register.org.submit': 'Register Organization',
        'register.org.hasaccount': 'Already have an account?',
        'register.org.login': 'Login',
        'register.org.specialist': 'Are you a specialist?',
        'register.org.specialist.link': 'Register as Specialist',
        'register.org.info.title': 'What happens after registration?',
        'register.org.info.1': '✓ Your account will be verified by our team',
        'register.org.info.2': '✓ You will receive a confirmation email',
        'register.org.info.3': '✓ You will be able to access the organization dashboard',
        'register.org.info.4': '✓ You will be able to request a cybersecurity assessment',

        // Register Specialist
        'register.spec.back': '← Back to Home',
        'register.spec.title': 'Specialist Registration',
        'register.spec.subtitle': 'Apply as a certified CPF3 Specialist',
        'register.spec.section.personal': 'Personal Data',
        'register.spec.section.professional': 'Professional Experience',
        'register.spec.section.credentials': 'Access Credentials',
        'register.spec.firstname': 'First Name *',
        'register.spec.lastname': 'Last Name *',
        'register.spec.email': 'Email *',
        'register.spec.phone': 'Phone',
        'register.spec.experience': 'Years of Experience *',
        'register.spec.certifications': 'Certifications (optional)',
        'register.spec.bio': 'Bio / Skills',
        'register.spec.password': 'Password *',
        'register.spec.password.confirm': 'Confirm Password *',
        'register.spec.terms': 'I accept the',
        'register.spec.submit': 'Apply as Specialist',
        'register.spec.hasaccount': 'Already have an account?',
        'register.spec.organization': 'Are you an organization?',
        'register.spec.organization.link': 'Register as Organization',
    }
};

// Language Manager Class
class LanguageManager {
    constructor() {
        this.currentLang = this.detectLanguage();
        this.init();
    }

    detectLanguage() {
        // Check localStorage first
        const savedLang = localStorage.getItem('certicredia_lang');
        if (savedLang && translations[savedLang]) {
            return savedLang;
        }

        // Check browser language
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang.startsWith('en')) {
            return 'en-US';
        }

        // Default to Italian
        return 'it';
    }

    init() {
        // Apply translations on page load
        this.applyTranslations();

        // Setup language switcher
        this.setupLanguageSwitcher();
    }

    applyTranslations() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.getTranslation(key);

            if (translation) {
                // Check if element is an input/textarea
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    if (element.hasAttribute('placeholder')) {
                        element.placeholder = translation;
                    }
                } else {
                    element.textContent = translation;
                }
            }
        });

        // Update HTML lang attribute
        document.documentElement.lang = this.currentLang === 'it' ? 'it' : 'en';
    }

    getTranslation(key) {
        return translations[this.currentLang]?.[key] || key;
    }

    setLanguage(lang) {
        if (!translations[lang]) return;

        this.currentLang = lang;
        localStorage.setItem('certicredia_lang', lang);
        this.applyTranslations();

        // Update active state in language switcher
        this.updateLanguageSwitcher();

        // Emit custom event for other components
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }

    setupLanguageSwitcher() {
        // Add language switcher to navbar
        const navbar = document.querySelector('#desktop-menu');
        const mobileMenu = document.querySelector('#mobile-menu .space-y-1');

        if (navbar) {
            const switcher = this.createLanguageSwitcher();
            navbar.insertBefore(switcher, navbar.lastElementChild);
        }

        if (mobileMenu) {
            const mobileSwitcher = this.createLanguageSwitcher(true);
            mobileMenu.appendChild(mobileSwitcher);
        }
    }

    createLanguageSwitcher(mobile = false) {
        const container = document.createElement('div');
        container.className = mobile
            ? 'px-3 py-2 flex gap-2'
            : 'flex gap-2 items-center';

        const createButton = (lang, label) => {
            const button = document.createElement('button');
            button.className = mobile
                ? 'px-3 py-1.5 rounded text-sm font-medium transition-colors'
                : 'px-3 py-1 rounded text-xs font-medium transition-colors';
            button.textContent = label;
            button.setAttribute('data-lang', lang);

            if (lang === this.currentLang) {
                button.className += mobile
                    ? ' bg-cyan-600 text-white'
                    : ' bg-cyan-600 text-white';
            } else {
                button.className += mobile
                    ? ' bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    : ' bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700';
            }

            button.addEventListener('click', () => this.setLanguage(lang));
            return button;
        };

        container.appendChild(createButton('it', 'IT'));
        container.appendChild(createButton('en-US', 'EN'));

        return container;
    }

    updateLanguageSwitcher() {
        const buttons = document.querySelectorAll('[data-lang]');
        buttons.forEach(button => {
            const lang = button.getAttribute('data-lang');
            const isMobile = button.classList.contains('py-1.5');

            if (lang === this.currentLang) {
                button.className = isMobile
                    ? 'px-3 py-1.5 rounded text-sm font-medium transition-colors bg-cyan-600 text-white'
                    : 'px-3 py-1 rounded text-xs font-medium transition-colors bg-cyan-600 text-white';
            } else {
                button.className = isMobile
                    ? 'px-3 py-1.5 rounded text-sm font-medium transition-colors bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    : 'px-3 py-1 rounded text-xs font-medium transition-colors bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700';
            }
        });
    }
}

// Initialize language manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.langManager = new LanguageManager();
    });
} else {
    window.langManager = new LanguageManager();
}
