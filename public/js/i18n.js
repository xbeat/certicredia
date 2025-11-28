/**
 * i18n - Client-side internationalization
 * Handles language switching and translation loading
 */

// Translation data
const translations = {
    it: null,
    en: null
};

// Current language
let currentLanguage = localStorage.getItem('language') || 'it';

/**
 * Load translations from server
 */
async function loadTranslations(lang) {
    if (translations[lang]) return translations[lang];

    try {
        const response = await fetch(`/locales/${lang}.json`);
        const data = await response.json();
        translations[lang] = data;
        return data;
    } catch (error) {
        console.error(`Failed to load translations for ${lang}:`, error);
        return null;
    }
}

/**
 * Get nested translation value
 */
function getTranslation(key, lang = currentLanguage) {
    const data = translations[lang];
    if (!data) return key;

    const keys = key.split('.');
    let value = data;

    for (const k of keys) {
        if (value[k] === undefined) return key;
        value = value[k];
    }

    return value;
}

/**
 * Translate all elements with data-i18n attribute
 */
function translatePage() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = getTranslation(key);
        element.textContent = translation;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        const translation = getTranslation(key);
        element.placeholder = translation;
    });

    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        const translation = getTranslation(key);
        element.title = translation;
    });
}

/**
 * Switch language
 */
async function switchLanguage(lang) {
    if (!['it', 'en'].includes(lang)) return;

    currentLanguage = lang;
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;

    await loadTranslations(lang);
    translatePage();

    // Update active language button
    document.querySelectorAll('.language-switcher button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
}

/**
 * Initialize i18n
 */
async function initI18n() {
    // Load current language translations
    await loadTranslations(currentLanguage);
    translatePage();

    // Set up language switcher buttons
    document.querySelectorAll('.language-switcher button').forEach(btn => {
        btn.addEventListener('click', () => switchLanguage(btn.dataset.lang));
        btn.classList.toggle('active', btn.dataset.lang === currentLanguage);
    });

    // Set document language
    document.documentElement.lang = currentLanguage;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initI18n);
} else {
    initI18n();
}
