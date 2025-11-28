// CertiCredia - Vanilla JavaScript Application

// ========================================
// CONSTANTS
// ========================================
const SYSTEM_INSTRUCTION = `
Sei l'assistente virtuale intelligente di "CertiCredia Italia", un ente di certificazione cybersecurity di alto livello.
Il tuo obiettivo è assistere due tipi di utenti:
1. Specialisti Cybersecurity: interessati a diventare auditor certificati CertiCredia per affiancare le aziende.
2. Aziende: interessate ad acquistare la certificazione CertiCredia, che include dashboard di conformità, matrice di compilazione e materiali formativi.

Tono di voce: Professional, sicuro, tecnico ma accessibile.
Rispondi in italiano. Sii conciso.
Se ti chiedono prezzi, invita a contattare il team commerciale tramite il form in basso.
Non inventare standard inesistenti, fai riferimento a standard come ISO 27001, NIS2 e GDPR come base del framework CertiCredia.
`;

// ========================================
// STATE
// ========================================
const state = {
    userType: 'COMPANY', // 'COMPANY' or 'SPECIALIST'
    isMobileMenuOpen: false,
    isChatOpen: false,
    chatMessages: [],
    isLoading: false
};

// ========================================
// NAVBAR
// ========================================
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const logo = document.getElementById('logo');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIcon = document.getElementById('menu-icon');
    const closeIcon = document.getElementById('close-icon');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

    // Scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            navbar.classList.add('navbar-scrolled', 'bg-slate-900/95', 'backdrop-blur-md', 'border-b', 'border-slate-800', 'py-4');
            navbar.classList.remove('bg-transparent', 'py-6');
        } else {
            navbar.classList.remove('navbar-scrolled', 'bg-slate-900/95', 'backdrop-blur-md', 'border-b', 'border-slate-800', 'py-4');
            navbar.classList.add('bg-transparent', 'py-6');
        }
    });

    // Logo click - scroll to top
    logo.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Mobile menu toggle
    mobileMenuBtn.addEventListener('click', () => {
        state.isMobileMenuOpen = !state.isMobileMenuOpen;

        if (state.isMobileMenuOpen) {
            mobileMenu.classList.remove('hidden');
            menuIcon.classList.add('hidden');
            closeIcon.classList.remove('hidden');
        } else {
            mobileMenu.classList.add('hidden');
            menuIcon.classList.remove('hidden');
            closeIcon.classList.add('hidden');
        }
    });

    // Close mobile menu on link click
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            state.isMobileMenuOpen = false;
            mobileMenu.classList.add('hidden');
            menuIcon.classList.remove('hidden');
            closeIcon.classList.add('hidden');
        });
    });
}

// ========================================
// SMOOTH SCROLL
// ========================================
function initSmoothScroll() {
    // Handle all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Handle buttons with data-scroll-to attribute
    document.querySelectorAll('[data-scroll-to]').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-scroll-to');
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ========================================
// CONTACT FORM
// ========================================
function initContactForm() {
    const btnCompany = document.getElementById('btn-company');
    const btnSpecialist = document.getElementById('btn-specialist');
    const companyField = document.getElementById('company-field');
    const specialistField = document.getElementById('specialist-field');
    const submitText = document.getElementById('submit-text');
    const contactForm = document.getElementById('contact-form');

    // Toggle user type
    function setUserType(type) {
        state.userType = type;

        if (type === 'COMPANY') {
            btnCompany.className = 'user-type-btn px-6 py-2 rounded-full text-sm font-medium transition-all bg-cyan-500 text-slate-900';
            btnSpecialist.className = 'user-type-btn px-6 py-2 rounded-full text-sm font-medium transition-all bg-slate-800 text-slate-400 border border-slate-700';
            companyField.classList.remove('hidden');
            specialistField.classList.add('hidden');
            submitText.textContent = 'Richiedi Preventivo Certificazione';
        } else {
            btnSpecialist.className = 'user-type-btn px-6 py-2 rounded-full text-sm font-medium transition-all bg-cyan-500 text-slate-900';
            btnCompany.className = 'user-type-btn px-6 py-2 rounded-full text-sm font-medium transition-all bg-slate-800 text-slate-400 border border-slate-700';
            companyField.classList.add('hidden');
            specialistField.classList.remove('hidden');
            submitText.textContent = 'Invia Candidatura';
        }
    }

    btnCompany.addEventListener('click', () => setUserType('COMPANY'));
    btnSpecialist.addEventListener('click', () => setUserType('SPECIALIST'));

    // Form submission
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(contactForm);
        const data = {
            userType: state.userType,
            name: formData.get('name'),
            email: formData.get('email'),
            company: formData.get('company'),
            linkedin: formData.get('linkedin'),
            message: formData.get('message')
        };

        console.log('Form submitted:', data);

        // Show success message
        alert('Grazie per il tuo interesse! Ti contatteremo entro 24 ore.');

        // Reset form
        contactForm.reset();
    });
}

// ========================================
// AI CHATBOT
// ========================================
function initChatbot() {
    const chatOpenBtn = document.getElementById('chat-open-btn');
    const chatCloseBtn = document.getElementById('chat-close-btn');
    const chatWindow = document.getElementById('chat-window');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatMessages = document.getElementById('chat-messages');

    // Initialize with welcome message
    state.chatMessages = [
        {
            role: 'model',
            text: "Ciao! Sono l'assistente virtuale di CertiCredia. Come posso aiutarti con le nostre certificazioni oggi?"
        }
    ];

    // Open/Close chat
    chatOpenBtn.addEventListener('click', () => {
        state.isChatOpen = true;
        chatOpenBtn.style.display = 'none';
        chatWindow.classList.remove('hidden');
    });

    chatCloseBtn.addEventListener('click', () => {
        state.isChatOpen = false;
        chatOpenBtn.style.display = 'flex';
        chatWindow.classList.add('hidden');
    });

    // Send message
    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message || state.isLoading) return;

        // Add user message to state and UI
        state.chatMessages.push({ role: 'user', text: message });
        appendMessage('user', message);
        chatInput.value = '';

        // Show loading
        state.isLoading = true;
        showTypingIndicator();
        chatSendBtn.disabled = true;

        try {
            // Simulate AI response (replace with actual Gemini API call if you have the key)
            await simulateAIResponse(message);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMsg = "Mi dispiace, si è verificato un errore tecnico. Riprova più tardi.";
            state.chatMessages.push({ role: 'model', text: errorMsg, isError: true });
            appendMessage('model', errorMsg, true);
        } finally {
            state.isLoading = false;
            hideTypingIndicator();
            chatSendBtn.disabled = false;
        }
    }

    // Simulate AI response (basic fallback)
    async function simulateAIResponse(userMessage) {
        return new Promise((resolve) => {
            setTimeout(() => {
                let response = "";

                const lowerMessage = userMessage.toLowerCase();

                if (lowerMessage.includes('prezzo') || lowerMessage.includes('costo') || lowerMessage.includes('quanto')) {
                    response = "Per informazioni sui prezzi e preventivi personalizzati, ti invito a compilare il form di contatto qui sotto. Il nostro team commerciale ti ricontatterà entro 24 ore con un'offerta su misura per le tue esigenze.";
                } else if (lowerMessage.includes('specialista') || lowerMessage.includes('auditor') || lowerMessage.includes('certificazione')) {
                    response = "Ottima domanda! CertiCredia offre un percorso di certificazione per diventare Auditor CPF3. Include formazione su psicologia cognitiva, accesso alla piattaforma di valutazione e opportunità di collaborazione con aziende clienti. Vuoi saperne di più sul programma di formazione?";
                } else if (lowerMessage.includes('iso') || lowerMessage.includes('27001') || lowerMessage.includes('nis2') || lowerMessage.includes('gdpr')) {
                    response = "Il framework CPF3:2025 di CertiCredia integra i principali standard internazionali come ISO 27001, NIS2 e GDPR, aggiungendo una componente innovativa di analisi psicologica del rischio umano. Questo approccio riduce significativamente gli incidenti legati al fattore umano.";
                } else if (lowerMessage.includes('azienda') || lowerMessage.includes('dashboard') || lowerMessage.includes('compliance')) {
                    response = "Per le aziende, offriamo un pacchetto completo che include: Dashboard di Compliance in tempo reale, Matrice di Compilazione guidata per policy aziendali, Materiali formativi per il personale, e Supporto di un Auditor certificato. Posso fornirti maggiori dettagli su uno di questi servizi?";
                } else {
                    response = "Grazie per la tua domanda! CertiCredia offre certificazioni cybersecurity innovative per specialisti e aziende. Il nostro framework CPF3:2025 unisce sicurezza tecnica e analisi comportamentale. Come posso aiutarti nello specifico? Sei interessato alla certificazione per specialisti o alle soluzioni aziendali?";
                }

                state.chatMessages.push({ role: 'model', text: response });
                appendMessage('model', response);
                resolve();
            }, 1500);
        });
    }

    // Append message to chat
    function appendMessage(role, text, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'} chat-message-enter`;

        const bubbleDiv = document.createElement('div');

        if (role === 'user') {
            bubbleDiv.className = 'max-w-[85%] rounded-2xl rounded-tr-none px-4 py-2.5 text-sm bg-cyan-600 text-white';
        } else if (isError) {
            bubbleDiv.className = 'max-w-[85%] rounded-2xl rounded-tl-none px-4 py-2.5 text-sm bg-red-500/20 text-red-200 border border-red-500/50';
        } else {
            bubbleDiv.className = 'max-w-[85%] rounded-2xl rounded-tl-none px-4 py-2.5 text-sm bg-slate-700 text-slate-200';
        }

        bubbleDiv.textContent = text;
        messageDiv.appendChild(bubbleDiv);
        chatMessages.appendChild(messageDiv);

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Show typing indicator
    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'typing-indicator';
        indicator.className = 'flex justify-start';
        indicator.innerHTML = `
            <div class="bg-slate-700 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                <svg class="w-4 h-4 text-cyan-400 spinner" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="text-xs text-slate-400">Sto pensando...</span>
            </div>
        `;
        chatMessages.appendChild(indicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Hide typing indicator
    function hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // Event listeners
    chatSendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

// ========================================
// HERO BUTTONS
// ========================================
function initHeroButtons() {
    // Get all buttons with data-scroll-to or that should scroll to companies
    const companyButtons = document.querySelectorAll('.btn-primary');

    companyButtons.forEach(button => {
        if (!button.hasAttribute('data-scroll-to') && button.textContent.includes('Aziende')) {
            button.addEventListener('click', () => {
                const companiesSection = document.getElementById('companies');
                if (companiesSection) {
                    companiesSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
    });
}

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 CertiCredia - Initializing...');

    initNavbar();
    initSmoothScroll();
    initContactForm();
    initChatbot();
    initHeroButtons();

    console.log('✅ CertiCredia - Ready!');
});

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Scroll to top
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Get scroll position
function getScrollPosition() {
    return window.pageYOffset || document.documentElement.scrollTop;
}

// Export for debugging
window.CertiCredia = {
    state,
    scrollToTop,
    getScrollPosition
};
