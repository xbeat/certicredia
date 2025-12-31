import { loadAllData, loadOrganizationDetails } from './api.js';
import { setupDashboardEventDelegation } from './events.js';
import { setupClientEventDelegation } from '../client/index.js'; // Importante! Attiva eventi client
import { setSelectedOrgId } from './state.js';

// Global callback for client to refresh dashboard
window.dashboardReloadOrganization = async function() {
    // Re-imports needed because this is global scope
    // We assume selectedOrgId is managed in state
    const { selectedOrgId } = await import('./state.js');
    if (selectedOrgId) {
        await loadOrganizationDetails(selectedOrgId);
    }
};

/**
 * Parse URL hash to get organization ID
 * Format: #organization/123
 */
function getOrganizationIdFromHash() {
    const hash = window.location.hash;
    const match = hash.match(/#organization\/(\d+)/);
    return match ? parseInt(match[1]) : null;
}

/**
 * Hide sidebar and show only organization details
 */
function hideSidebar() {
    const sidebar = document.getElementById('org-sidebar');
    const mainContent = document.getElementById('main-content');
    const sidebarOpenBtn = document.getElementById('sidebarOpenBtn');

    if (sidebar) {
        sidebar.style.display = 'none';
        sidebar.classList.add('sidebar-hidden');
    }

    if (mainContent) {
        mainContent.style.marginLeft = '0';
        mainContent.style.width = '100%';
    }

    // Hide the "open sidebar" button since we're in single-org mode
    if (sidebarOpenBtn) {
        sidebarOpenBtn.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Setup Events
    setupDashboardEventDelegation();
    setupClientEventDelegation(); // Client logic listeners

    // 2. Check for organization ID in URL hash
    const orgIdFromHash = getOrganizationIdFromHash();

    if (orgIdFromHash) {
        // Single organization mode (opened from admin panel)
        console.log(`[Auditing] Opening dashboard for organization ID: ${orgIdFromHash}`);

        // Hide sidebar
        hideSidebar();

        // Set selected org ID
        setSelectedOrgId(orgIdFromHash);

        // Load only this organization's data
        await loadOrganizationDetails(orgIdFromHash);
    } else {
        // Multi-organization mode (normal dashboard)
        console.log('[Auditing] Opening dashboard in multi-organization mode');

        // Load all organizations
        await loadAllData();
    }
});