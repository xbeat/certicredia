/**
 * Inline Auth Check - Place in <head> for instant protection
 *
 * This script runs SYNCHRONOUSLY before body renders,
 * preventing any flash of unauthorized content.
 *
 * Usage: Add in <head> of protected pages:
 * <script src="/public/js/inline-auth-check.js"></script>
 */

(function() {
  'use strict';

  // Route configuration
  const PROTECTED_ROUTES = {
    '/public/pages/ente/dashboard.html': ['organization_admin', 'organization_operator'],
    '/public/pages/specialist/dashboard.html': ['specialist'],
    '/public/pages/admin/index.html': ['admin']
  };

  const currentPath = window.location.pathname;
  const requiredRoles = PROTECTED_ROUTES[currentPath];

  // If this page requires auth
  if (requiredRoles) {
    const token = localStorage.getItem('token');

    // No token = immediate redirect (before rendering)
    if (!token) {
      const returnUrl = encodeURIComponent(currentPath);
      window.location.replace(`/public/pages/login.html?returnUrl=${returnUrl}`);
      return; // Stop execution
    }

    // Check role
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const hasValidRole = requiredRoles.includes(user.role);

        if (!hasValidRole) {
          // Wrong role = block rendering and show error
          document.addEventListener('DOMContentLoaded', function() {
            document.body.innerHTML = `
              <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f3f4f6; font-family: system-ui, -apple-system, sans-serif;">
                <div style="text-align: center; max-width: 400px; padding: 2rem;">
                  <svg style="width: 80px; height: 80px; margin: 0 auto 1.5rem; color: #ef4444;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                  <h1 style="font-size: 1.5rem; font-weight: bold; color: #1f2937; margin-bottom: 0.5rem;">Accesso Negato</h1>
                  <p style="color: #6b7280; margin-bottom: 1.5rem;">Non hai i permessi necessari per accedere a questa pagina.</p>
                  <a href="/public/pages/login.html" style="display: inline-block; background: #0891b2; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600;">
                    Vai al Login
                  </a>
                </div>
              </div>
            `;
          });
          return;
        }
      }
    } catch (e) {
      console.error('Error checking user role:', e);
    }
  }

  // If we reach here, user is authenticated with correct role
  // Page will render normally
})();
