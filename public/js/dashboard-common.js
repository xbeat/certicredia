/**
 * Common Dashboard Functions
 * Used by all dashboard pages (admin, ente, specialist)
 */

const API_BASE = window.location.origin + '/api';

/**
 * Get auth token from localStorage
 */
function getAuthToken() {
  return localStorage.getItem('token');
}

/**
 * Get current user from localStorage
 */
function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * Logout user
 */
function logout() {
  // Clear localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');

  // Clear cookies (if any)
  document.cookie.split(";").forEach(function(c) {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });

  // Redirect to login
  window.location.href = '/public/pages/login.html';
}

/**
 * Make authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();

    // If unauthorized, logout
    if (response.status === 401) {
      console.error('Unauthorized - logging out');
      logout();
      return null;
    }

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Display user info in header
 */
function displayUserInfo() {
  const user = getCurrentUser();
  if (!user) return;

  // Find user info elements
  const userNameEl = document.getElementById('userName');
  const userEmailEl = document.getElementById('userEmail');
  const userRoleEl = document.getElementById('userRole');

  if (userNameEl) userNameEl.textContent = user.name || user.email;
  if (userEmailEl) userEmailEl.textContent = user.email;
  if (userRoleEl) {
    const roleLabels = {
      'admin': 'Amministratore',
      'organization_admin': 'Admin Organizzazione',
      'organization_operator': 'Operatore',
      'specialist': 'Specialist',
      'user': 'Utente'
    };
    userRoleEl.textContent = roleLabels[user.role] || user.role;
  }
}

/**
 * Show loading state
 */
function showLoading(elementId) {
  const el = document.getElementById(elementId);
  if (el) {
    el.innerHTML = `
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    `;
  }
}

/**
 * Show error message
 */
function showError(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) {
    el.innerHTML = `
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-800">${message}</p>
      </div>
    `;
  }
}

/**
 * Show success message
 */
function showSuccess(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) {
    el.innerHTML = `
      <div class="bg-green-50 border border-green-200 rounded-lg p-4">
        <p class="text-green-800">${message}</p>
      </div>
    `;
  }
}

/**
 * Format date
 */
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format datetime
 */
function formatDateTime(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Initialize logout button
 */
function initLogoutButton() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Sei sicuro di voler uscire?')) {
        logout();
      }
    });
  }
}

/**
 * Initialize sidebar navigation
 */
function initSidebarNavigation() {
  const navLinks = document.querySelectorAll('nav a[href^="#"]');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('href').substring(1);

      // Remove active class from all links
      navLinks.forEach(l => {
        l.classList.remove('bg-gray-800', 'text-cyan-400', 'border-l-4', 'border-cyan-400');
      });

      // Add active class to clicked link
      link.classList.add('bg-gray-800', 'text-cyan-400', 'border-l-4', 'border-cyan-400');

      // Hide all sections
      document.querySelectorAll('[data-section]').forEach(section => {
        section.classList.add('hidden');
      });

      // Show target section
      const targetSection = document.querySelector(`[data-section="${target}"]`);
      if (targetSection) {
        targetSection.classList.remove('hidden');
      }
    });
  });
}

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  displayUserInfo();
  initLogoutButton();
  initSidebarNavigation();
});
