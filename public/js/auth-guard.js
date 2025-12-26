/**
 * Auth Guard - Client-side Route Protection
 *
 * Protegge le pagine riservate verificando:
 * 1. Presenza del token JWT in localStorage
 * 2. Ruolo dell'utente (opzionale)
 * 3. Redirect automatico a login se non autenticato
 *
 * IMPORTANTE: Questa è protezione lato CLIENT per UX.
 * La vera sicurezza è lato SERVER (le API richiedono JWT).
 */

(function() {
  'use strict';

  const AuthGuard = {
    // Percorsi pubblici (non richiedono autenticazione)
    publicPaths: [
      '/public/app.html',
      '/public/pages/login.html',
      '/public/pages/register.html',
      '/public/pages/forgot-password.html'
    ],

    // Percorsi protetti con ruoli richiesti
    protectedRoutes: {
      '/public/pages/ente/dashboard.html': ['org_admin', 'org_operative'],
      '/public/pages/specialist/dashboard.html': ['specialist', 'candidate_specialist'],
      '/public/pages/admin/index.html': ['super_admin', 'admin']
    },

    /**
     * Controlla se l'utente è autenticato
     */
    isAuthenticated() {
      const token = localStorage.getItem('token');
      return !!token;
    },

    /**
     * Ottiene i dati utente da localStorage
     */
    getUser() {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;

      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing user data:', e);
        return null;
      }
    },

    /**
     * Controlla se l'utente ha uno dei ruoli richiesti
     */
    hasRole(requiredRoles) {
      const user = this.getUser();
      if (!user || !user.role) return false;

      return requiredRoles.includes(user.role);
    },

    /**
     * Ottiene il path corrente normalizzato
     */
    getCurrentPath() {
      return window.location.pathname;
    },

    /**
     * Redirect a pagina di login
     */
    redirectToLogin() {
      const currentPath = this.getCurrentPath();
      const returnUrl = encodeURIComponent(currentPath);
      window.location.href = `/public/pages/login.html?returnUrl=${returnUrl}`;
    },

    /**
     * Redirect a pagina corretta in base al ruolo
     */
    redirectToCorrectDashboard() {
      const user = this.getUser();
      if (!user || !user.role) {
        this.redirectToLogin();
        return;
      }

      const role = user.role;
      let targetPath = '/public/app.html';

      // Determina dashboard corretta in base al ruolo
      switch (role) {
        case 'super_admin':
        case 'admin':
          targetPath = '/public/pages/admin/index.html';
          break;
        case 'specialist':
        case 'candidate_specialist':
          targetPath = '/public/pages/specialist/dashboard.html';
          break;
        case 'org_admin':
        case 'org_operative':
          targetPath = '/public/pages/ente/dashboard.html';
          break;
      }

      // Solo redirect se siamo su una pagina diversa
      if (this.getCurrentPath() !== targetPath) {
        window.location.href = targetPath;
      }
    },

    /**
     * Mostra messaggio di accesso negato
     */
    showAccessDenied() {
      document.body.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f3f4f6; font-family: system-ui, -apple-system, sans-serif;">
          <div style="text-align: center; max-width: 400px; padding: 2rem;">
            <svg style="width: 80px; height: 80px; margin: 0 auto 1.5rem; color: #ef4444;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            <h1 style="font-size: 1.5rem; font-weight: bold; color: #1f2937; margin-bottom: 0.5rem;">Accesso Negato</h1>
            <p style="color: #6b7280; margin-bottom: 1.5rem;">Non hai i permessi per accedere a questa pagina.</p>
            <a href="/public/pages/login.html" style="display: inline-block; background: #0891b2; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600;">
              Vai al Login
            </a>
          </div>
        </div>
      `;
    },

    /**
     * Inizializza la protezione della route
     */
    init() {
      const currentPath = this.getCurrentPath();

      // Se siamo su una pagina pubblica, non fare nulla
      if (this.publicPaths.includes(currentPath)) {
        return;
      }

      // Controlla se la pagina richiede autenticazione
      const requiredRoles = this.protectedRoutes[currentPath];

      if (requiredRoles) {
        // Pagina protetta - verifica autenticazione
        if (!this.isAuthenticated()) {
          console.warn('🔒 User not authenticated. Redirecting to login...');
          this.redirectToLogin();
          return;
        }

        // Verifica ruolo
        if (!this.hasRole(requiredRoles)) {
          console.warn('🚫 User does not have required role. Access denied.');
          this.showAccessDenied();
          return;
        }

        // Tutto ok - utente autenticato con ruolo corretto
        console.log('✅ Access granted');
      }
    }
  };

  // Esegui controllo quando DOM è pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AuthGuard.init());
  } else {
    AuthGuard.init();
  }

  // Esponi globalmente per debug
  window.AuthGuard = AuthGuard;
})();
