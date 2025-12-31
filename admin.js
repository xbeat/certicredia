/**
 * CertiCredia Admin Panel - JavaScript
 */

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';

// State
const state = {
    user: null,
    products: [],
    orders: [],
    users: [],
    contacts: [],
    currentSection: 'dashboard',
    pagination: {
        products: { page: 1, perPage: 20 },
        orders: { page: 1, perPage: 20 },
        users: { page: 1, perPage: 20 },
        contacts: { page: 1, perPage: 20 },
        organizations: { page: 1, perPage: 20 },
        specialists: { page: 1, perPage: 20 }
    }
};

// Pagination helpers
function paginateArray(array, page, perPage) {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return {
        items: array.slice(start, end),
        total: array.length,
        page: page,
        perPage: perPage,
        totalPages: Math.ceil(array.length / perPage)
    };
}

function renderPaginationControls(containerId, type, paginationData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { page, limit, total, totalPages } = paginationData;

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    const startItem = (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, total);

    container.innerHTML = `
        <div class="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-t border-slate-700">
            <div class="flex items-center text-sm text-slate-400">
                <span>Mostrando <span class="font-medium text-white">${startItem}</span> - <span class="font-medium text-white">${endItem}</span> di <span class="font-medium text-white">${total}</span> risultati</span>
            </div>
            <div class="flex items-center gap-2">
                <button
                    onclick="changePage('${type}', ${page - 1})"
                    ${page === 1 ? 'disabled' : ''}
                    class="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors text-sm"
                >
                    Precedente
                </button>
                <span class="text-sm text-slate-400">
                    Pagina <span class="font-medium text-white">${page}</span> di <span class="font-medium text-white">${totalPages}</span>
                </span>
                <button
                    onclick="changePage('${type}', ${page + 1})"
                    ${page === totalPages ? 'disabled' : ''}
                    class="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors text-sm"
                >
                    Successiva
                </button>
            </div>
        </div>
    `;
}

function changePage(type, newPage) {
    state.pagination[type].page = newPage;
    switch(type) {
        case 'products': loadProducts(); break;
        case 'orders': loadOrders(); break;
        case 'users': loadUsers(); break;
        case 'contacts': loadContacts(); break;
        case 'organizations': loadOrganizations(); break;
        case 'specialists': loadSpecialists(); break;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await loadDashboard();

    // Event listeners
    document.getElementById('logout-btn')?.addEventListener('click', logout);
    document.getElementById('product-edit-form')?.addEventListener('submit', handleProductSubmit);
});

// Authentication
async function checkAuth() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/public/pages/app-landing.html';
            return;
        }

        const response = await fetch(`${API_BASE}/api/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Unauthorized');
        }

        const data = await response.json();
        state.user = data.data;

        // Check if user is admin
        if (state.user.role !== 'admin') {
            alert('Accesso negato: solo gli amministratori possono accedere a questa pagina');
            window.location.href = '/';
            return;
        }

        document.getElementById('admin-user-name').textContent = state.user.name;

    } catch (error) {
        console.error('Auth error:', error);
        localStorage.removeItem('token');
        window.location.href = '/public/pages/app-landing.html';
    }
}

async function logout() {
    try {
        await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST' });
    } catch (error) {
        console.error('Logout error:', error);
    }

    // Clear all possible token/user storage keys
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('refreshToken');

    window.location.href = '/public/pages/app-landing.html';
}

// Dashboard
async function loadDashboard() {
    try {
        const token = localStorage.getItem('token');

        // Load all stats in parallel
        const [productsRes, ordersRes, usersRes, contactsRes] = await Promise.all([
            fetch(`${API_BASE}/api/products`, { headers: { 'Authorization': `Bearer ${token}` } }),
            apiCall('/api/orders/admin/all'),
            apiCall('/api/auth/users'),  // Will need to create this endpoint
            apiCall('/api/contact')
        ]);

        const products = await productsRes.json();
        const orders = ordersRes ? await ordersRes.json() : { data: [] };
        const users = usersRes ? await usersRes.json() : { data: [] };
        const contacts = contactsRes ? await contactsRes.json() : { data: [] };

        // Update stats
        document.getElementById('stats-products').textContent = products.data?.length || 0;
        document.getElementById('stats-orders').textContent = orders.data?.length || 0;
        document.getElementById('stats-users').textContent = users.data?.length || 0;
        document.getElementById('stats-contacts').textContent = contacts.data?.length || 0;

        // Show recent orders
        const recentOrders = orders.data?.slice(0, 5) || [];
        const recentOrdersHtml = recentOrders.map(order => `
            <div class="flex justify-between items-center p-3 bg-slate-900 rounded-lg">
                <div>
                    <p class="font-medium">${order.order_number}</p>
                    <p class="text-sm text-slate-400">${order.billing_name} - €${parseFloat(order.total_amount).toFixed(2)}</p>
                </div>
                <span class="px-3 py-1 rounded-full text-xs ${getStatusColor(order.status)}">${getStatusLabel(order.status)}</span>
            </div>
        `).join('');

        document.getElementById('recent-orders').innerHTML = recentOrdersHtml || '<p class="text-slate-400 text-sm">Nessun ordine</p>';

    } catch (error) {
        console.error('Dashboard load error:', error);
        notify('Errore caricamento dashboard', 'error');
    }
}

// Section Navigation
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section-content').forEach(section => {
        section.classList.add('hidden');
    });

    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active', 'bg-slate-700');
    });

    // Show selected section
    document.getElementById(`section-${sectionName}`).classList.remove('hidden');

    // Add active class to clicked nav item
    const navItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (navItem) {
        navItem.classList.add('active', 'bg-slate-700');
    }

    state.currentSection = sectionName;

    // Load section data
    switch(sectionName) {
        case 'products':
            loadProducts();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'users':
            loadUsers();
            break;
        case 'contacts':
            loadContacts();
            break;
        case 'organizations':
            loadOrganizations();
            break;
        case 'specialists':
            loadSpecialists();
            break;
        case 'assessments':
            // No data to load for assessments placeholder
            break;
        case 'dashboard':
            loadDashboard();
            break;
    }
}

// Products Management
async function loadProducts() {
    try {
        const { page, perPage } = state.pagination.products;
        const response = await apiCall(`/api/products/admin/all?page=${page}&limit=${perPage}`);
        if (!response) return;

        const data = await response.json();
        state.products = data.data || [];
        allProducts = data.data || [];

        displayProducts(allProducts);

        // Render pagination controls if pagination data is available
        if (data.pagination) {
            renderPaginationControls('products-pagination', 'products', data.pagination);
        }

    } catch (error) {
        console.error('Load products error:', error);
        notify('Errore caricamento prodotti', 'error');
    }
}

function displayProducts(products) {
    const tbody = document.getElementById('products-table-body');
    if (!products || products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center p-8 text-slate-400">Nessun prodotto trovato</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(product => `
        <tr class="border-t border-slate-700 hover:bg-slate-750">
            <td class="p-4">
                <div>
                    <p class="font-medium">${product.name}</p>
                    <p class="text-sm text-slate-400">${product.slug}</p>
                </div>
            </td>
            <td class="p-4 text-slate-300">${product.category || '-'}</td>
            <td class="p-4 font-medium">€${parseFloat(product.price).toFixed(2)}</td>
            <td class="p-4">
                <span class="px-3 py-1 rounded-full text-xs ${product.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">
                    ${product.active ? 'Attivo' : 'Inattivo'}
                </span>
            </td>
            <td class="p-4 text-right">
                <button onclick="editProduct(${product.id})" class="text-cyan-400 hover:text-cyan-300 mr-3">Modifica</button>
                <button onclick="toggleProductStatus(${product.id}, ${!product.active})" class="text-${product.active ? 'red' : 'green'}-400 hover:text-${product.active ? 'red' : 'green'}-300">
                    ${product.active ? 'Disattiva' : 'Attiva'}
                </button>
            </td>
        </tr>
    `).join('');
}

function filterProducts() {
    const nameFilter = document.getElementById('product-filter-name').value.toLowerCase();
    const categoryFilter = document.getElementById('product-filter-category').value.toLowerCase();
    const statusFilter = document.getElementById('product-filter-status').value;

    const filtered = allProducts.filter(product => {
        const matchName = !nameFilter || product.name.toLowerCase().includes(nameFilter) || (product.slug && product.slug.toLowerCase().includes(nameFilter));
        const matchCategory = !categoryFilter || (product.category && product.category.toLowerCase().includes(categoryFilter));
        const matchStatus = !statusFilter || product.active.toString() === statusFilter;
        return matchName && matchCategory && matchStatus;
    });

    displayProducts(filtered);
}

function resetProductFilters() {
    document.getElementById('product-filter-name').value = '';
    document.getElementById('product-filter-category').value = '';
    document.getElementById('product-filter-status').value = '';
    displayProducts(allProducts);
}

function showProductForm() {
    document.getElementById('product-form').classList.remove('hidden');
    document.getElementById('product-form-title').textContent = 'Nuovo Prodotto';
    document.getElementById('product-edit-form').reset();
    document.getElementById('product-id').value = '';
}

function hideProductForm() {
    document.getElementById('product-form').classList.add('hidden');
}

function editProduct(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('product-form').classList.remove('hidden');
    document.getElementById('product-form-title').textContent = 'Modifica Prodotto';
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-slug').value = product.slug;
    document.getElementById('product-short-desc').value = product.short_description || '';
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-category').value = product.category || '';
    document.getElementById('product-duration').value = product.duration_months || '';
}

async function handleProductSubmit(e) {
    e.preventDefault();

    const productId = document.getElementById('product-id').value;
    const productData = {
        name: document.getElementById('product-name').value,
        slug: document.getElementById('product-slug').value,
        short_description: document.getElementById('product-short-desc').value,
        description: document.getElementById('product-description').value,
        price: parseFloat(document.getElementById('product-price').value),
        category: document.getElementById('product-category').value,
        duration_months: parseInt(document.getElementById('product-duration').value) || null
    };

    try {
        const url = productId ? `/api/products/${productId}` : '/api/products';
        const method = productId ? 'PUT' : 'POST';

        const response = await apiCall(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });

        if (!response) return;

        notify(`Prodotto ${productId ? 'aggiornato' : 'creato'} con successo`, 'success');
        hideProductForm();
        loadProducts();

    } catch (error) {
        console.error('Save product error:', error);
        notify('Errore salvataggio prodotto', 'error');
    }
}

async function toggleProductStatus(productId, newStatus) {
    try {
        const response = await apiCall(`/api/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: newStatus })
        });

        if (!response) return;

        notify('Stato prodotto aggiornato', 'success');
        loadProducts();

    } catch (error) {
        console.error('Toggle product status error:', error);
        notify('Errore aggiornamento stato', 'error');
    }
}

// Orders Management
async function loadOrders() {
    try {
        const { page, perPage } = state.pagination.orders;
        const response = await apiCall(`/api/orders/admin/all?page=${page}&limit=${perPage}`);
        if (!response) return;

        const data = await response.json();
        state.orders = data.data || [];
        allOrders = data.data || [];

        displayOrders(allOrders);

        // Render pagination controls if pagination data is available
        if (data.pagination) {
            renderPaginationControls('orders-pagination', 'orders', data.pagination);
        }

    } catch (error) {
        console.error('Load orders error:', error);
        notify('Errore caricamento ordini', 'error');
    }
}

function displayOrders(orders) {
    const tbody = document.getElementById('orders-table-body');
    if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center p-8 text-slate-400">Nessun ordine trovato</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(order => `
        <tr class="border-t border-slate-700 hover:bg-slate-750">
            <td class="p-4">
                <p class="font-medium">${order.order_number}</p>
            </td>
            <td class="p-4">
                <div>
                    <p class="font-medium">${order.billing_name}</p>
                    <p class="text-sm text-slate-400">${order.billing_email}</p>
                </div>
            </td>
            <td class="p-4 font-medium">€${parseFloat(order.total_amount).toFixed(2)}</td>
            <td class="p-4">
                <span class="px-3 py-1 rounded-full text-xs ${getStatusColor(order.status)}">
                    ${getStatusLabel(order.status)}
                </span>
            </td>
            <td class="p-4 text-slate-300">${new Date(order.created_at).toLocaleDateString('it-IT')}</td>
            <td class="p-4 text-right">
                <button onclick="viewOrder(${order.id})" class="text-cyan-400 hover:text-cyan-300">Dettagli</button>
            </td>
        </tr>
    `).join('');
}

function filterOrders() {
    const numberFilter = document.getElementById('order-filter-number').value.toLowerCase();
    const customerFilter = document.getElementById('order-filter-customer').value.toLowerCase();
    const statusFilter = document.getElementById('order-filter-status').value;

    const filtered = allOrders.filter(order => {
        const matchNumber = !numberFilter || order.order_number.toLowerCase().includes(numberFilter);
        const matchCustomer = !customerFilter || order.billing_name.toLowerCase().includes(customerFilter) || order.billing_email.toLowerCase().includes(customerFilter);
        const matchStatus = !statusFilter || order.status === statusFilter;
        return matchNumber && matchCustomer && matchStatus;
    });

    displayOrders(filtered);
}

function resetOrderFilters() {
    document.getElementById('order-filter-number').value = '';
    document.getElementById('order-filter-customer').value = '';
    document.getElementById('order-filter-status').value = '';
    displayOrders(allOrders);
}

async function viewOrder(orderId) {
    try {
        const response = await apiCall(`/api/orders/${orderId}`);
        if (!response) return;

        const data = await response.json();
        const order = data.data;

        const content = `
            <div class="space-y-6">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm text-slate-400">Numero Ordine</p>
                        <p class="font-medium">${order.order_number}</p>
                    </div>
                    <div>
                        <p class="text-sm text-slate-400">Data</p>
                        <p class="font-medium">${new Date(order.created_at).toLocaleString('it-IT')}</p>
                    </div>
                    <div>
                        <p class="text-sm text-slate-400">Cliente</p>
                        <p class="font-medium">${order.billing_name}</p>
                        <p class="text-sm text-slate-400">${order.billing_email}</p>
                        <p class="text-sm text-slate-400">${order.billing_phone}</p>
                    </div>
                    <div>
                        <p class="text-sm text-slate-400">Indirizzo Fatturazione</p>
                        <p class="text-sm">${order.billing_address}</p>
                        <p class="text-sm">${order.billing_postal_code} ${order.billing_city}</p>
                        <p class="text-sm">${order.billing_country}</p>
                    </div>
                </div>

                <div>
                    <h3 class="font-bold mb-3">Prodotti</h3>
                    <div class="bg-slate-900 rounded-lg divide-y divide-slate-800">
                        ${order.items.map(item => `
                            <div class="p-4 flex justify-between">
                                <div>
                                    <p class="font-medium">${item.product_name}</p>
                                    <p class="text-sm text-slate-400">Quantità: ${item.quantity}</p>
                                </div>
                                <p class="font-medium">€${parseFloat(item.total_price).toFixed(2)}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="flex justify-between items-center pt-4 border-t border-slate-700">
                    <p class="text-lg font-bold">Totale</p>
                    <p class="text-2xl font-bold text-cyan-400">€${parseFloat(order.total_amount).toFixed(2)}</p>
                </div>

                <div>
                    <label class="block text-sm text-slate-400 mb-2">Stato Ordine</label>
                    <select id="order-status-select" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>In Attesa</option>
                        <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confermato</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>In Lavorazione</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completato</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Annullato</option>
                    </select>
                </div>

                <button onclick="updateOrderStatus(${order.id})" class="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold py-3 rounded-lg">
                    Aggiorna Stato
                </button>
            </div>
        `;

        document.getElementById('order-detail-content').innerHTML = content;
        document.getElementById('order-modal').classList.remove('hidden');

    } catch (error) {
        console.error('View order error:', error);
        notify('Errore caricamento dettagli ordine', 'error');
    }
}

async function updateOrderStatus(orderId) {
    const newStatus = document.getElementById('order-status-select').value;

    try {
        const response = await apiCall(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response) return;

        notify('Stato ordine aggiornato', 'success');
        closeOrderModal();
        loadOrders();

    } catch (error) {
        console.error('Update order status error:', error);
        notify('Errore aggiornamento stato ordine', 'error');
    }
}

function closeOrderModal() {
    document.getElementById('order-modal').classList.add('hidden');
}

// Users Management
async function loadUsers() {
    try {
        const { page, perPage } = state.pagination.users;
        const response = await apiCall(`/api/auth/users?page=${page}&limit=${perPage}`);
        if (!response) {
            // Fallback: show empty state
            document.getElementById('users-table-body').innerHTML = '<tr><td colspan="6" class="p-4 text-center text-slate-400">Endpoint utenti non ancora implementato</td></tr>';
            return;
        }

        const data = await response.json();
        state.users = data.data || [];
        allUsers = data.data || [];

        displayUsers(allUsers);

        // Render pagination controls if pagination data is available
        if (data.pagination) {
            renderPaginationControls('users-pagination', 'users', data.pagination);
        }

    } catch (error) {
        console.error('Load users error:', error);
        document.getElementById('users-table-body').innerHTML = '<tr><td colspan="6" class="p-4 text-center text-slate-400">Nessun utente</td></tr>';
    }
}

function displayUsers(users) {
    const tbody = document.getElementById('users-table-body');
    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center p-8 text-slate-400">Nessun utente trovato</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr class="border-t border-slate-700 hover:bg-slate-750">
            <td class="p-4">
                <p class="font-medium">${user.name}</p>
                ${user.company ? `<p class="text-sm text-slate-400">${user.company}</p>` : ''}
            </td>
            <td class="p-4 text-slate-300">${user.email}</td>
            <td class="p-4">
                <span class="px-3 py-1 rounded-full text-xs ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}">
                    ${getRoleLabel(user.role)}
                </span>
            </td>
            <td class="p-4 text-slate-300">${new Date(user.created_at).toLocaleDateString('it-IT')}</td>
            <td class="p-4">
                <span class="px-3 py-1 rounded-full text-xs ${user.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">
                    ${user.active ? 'Attivo' : 'Inattivo'}
                </span>
            </td>
            <td class="p-4 text-right">
                <button onclick="toggleUserStatus(${user.id}, ${!user.active})" class="text-${user.active ? 'red' : 'green'}-400 hover:text-${user.active ? 'red' : 'green'}-300 text-sm">
                    ${user.active ? 'Disattiva' : 'Attiva'}
                </button>
            </td>
        </tr>
    `).join('');
}

function getRoleLabel(role) {
    const labels = {
        'admin': 'Admin',
        'user': 'Utente',
        'specialist': 'Specialist',
        'organization_admin': 'Org. Admin',
        'organization_operator': 'Org. Operator'
    };
    return labels[role] || role;
}

function filterUsers() {
    const nameFilter = document.getElementById('user-filter-name').value.toLowerCase();
    const roleFilter = document.getElementById('user-filter-role').value;
    const statusFilter = document.getElementById('user-filter-status').value;

    const filtered = allUsers.filter(user => {
        const matchName = !nameFilter || user.name.toLowerCase().includes(nameFilter) || user.email.toLowerCase().includes(nameFilter);
        const matchRole = !roleFilter || user.role === roleFilter;
        const matchStatus = !statusFilter || user.active.toString() === statusFilter;
        return matchName && matchRole && matchStatus;
    });

    displayUsers(filtered);
}

function resetUserFilters() {
    document.getElementById('user-filter-name').value = '';
    document.getElementById('user-filter-role').value = '';
    document.getElementById('user-filter-status').value = '';
    displayUsers(allUsers);
}

// Contacts Management
async function loadContacts() {
    try {
        const { page, perPage } = state.pagination.contacts;
        const response = await apiCall(`/api/contact?page=${page}&limit=${perPage}`);
        if (!response) return;

        const data = await response.json();
        state.contacts = data.data || [];
        allContacts = data.data || [];

        displayContacts(allContacts);

        // Render pagination controls if pagination data is available
        if (data.pagination) {
            renderPaginationControls('contacts-pagination', 'contacts', data.pagination);
        }

    } catch (error) {
        console.error('Load contacts error:', error);
        notify('Errore caricamento contatti', 'error');
    }
}

function displayContacts(contacts) {
    const tbody = document.getElementById('contacts-table-body');
    if (!contacts || contacts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center p-8 text-slate-400">Nessun contatto trovato</td></tr>';
        return;
    }

    tbody.innerHTML = contacts.map(contact => `
        <tr class="border-t border-slate-700 hover:bg-slate-750">
            <td class="p-4">
                <p class="font-medium">${contact.name}</p>
                ${contact.company ? `<p class="text-sm text-slate-400">${contact.company}</p>` : ''}
                ${contact.linkedin ? `<p class="text-sm text-slate-400">${contact.linkedin}</p>` : ''}
            </td>
            <td class="p-4 text-slate-300">${contact.email}</td>
            <td class="p-4">
                <span class="px-2 py-1 rounded text-xs ${contact.user_type === 'COMPANY' ? 'bg-blue-500/20 text-blue-400' : 'bg-cyan-500/20 text-cyan-400'}">
                    ${contact.user_type === 'COMPANY' ? 'Azienda' : 'Specialist'}
                </span>
            </td>
            <td class="p-4 text-sm text-slate-300 max-w-xs truncate">${contact.message || '-'}</td>
            <td class="p-4 text-slate-300">${new Date(contact.created_at).toLocaleDateString('it-IT')}</td>
            <td class="p-4">
                <select onchange="updateContactStatus(${contact.id}, this.value)" class="px-3 py-1 rounded-full text-xs bg-slate-900 border ${getContactStatusBorderColor(contact.status)} ${getContactStatusTextColor(contact.status)}">
                    <option value="new" ${contact.status === 'new' ? 'selected' : ''}>Nuovo</option>
                    <option value="contacted" ${contact.status === 'contacted' ? 'selected' : ''}>Contattato</option>
                    <option value="closed" ${contact.status === 'closed' ? 'selected' : ''}>Chiuso</option>
                </select>
            </td>
            <td class="p-4 text-right">
                <button onclick="viewContactDetails(${contact.id})" class="text-cyan-400 hover:text-cyan-300 text-sm">
                    Dettagli
                </button>
            </td>
        </tr>
    `).join('');
}

function filterContacts() {
    const nameFilter = document.getElementById('contact-filter-name').value.toLowerCase();
    const typeFilter = document.getElementById('contact-filter-type').value;
    const statusFilter = document.getElementById('contact-filter-status').value;

    const filtered = allContacts.filter(contact => {
        const matchName = !nameFilter || contact.name.toLowerCase().includes(nameFilter) || contact.email.toLowerCase().includes(nameFilter);
        const matchType = !typeFilter || contact.user_type === typeFilter;
        const matchStatus = !statusFilter || contact.status === statusFilter;
        return matchName && matchType && matchStatus;
    });

    displayContacts(filtered);
}

function resetContactFilters() {
    document.getElementById('contact-filter-name').value = '';
    document.getElementById('contact-filter-type').value = '';
    document.getElementById('contact-filter-status').value = '';
    displayContacts(allContacts);
}

// Utility Functions
async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/public/pages/app-landing.html';
        return null;
    }

    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`,
            ...options.headers
        }
    };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, { ...defaultOptions, ...options });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/public/pages/app-landing.html';
                return null;
            }
            throw new Error(`HTTP ${response.status}`);
        }

        return response;
    } catch (error) {
        console.error('API call error:', error);
        notify('Errore di connessione', 'error');
        return null;
    }
}

function getStatusColor(status) {
    const colors = {
        'pending': 'bg-yellow-500/20 text-yellow-400',
        'confirmed': 'bg-blue-500/20 text-blue-400',
        'processing': 'bg-purple-500/20 text-purple-400',
        'completed': 'bg-green-500/20 text-green-400',
        'cancelled': 'bg-red-500/20 text-red-400'
    };
    return colors[status] || 'bg-slate-500/20 text-slate-400';
}

function getStatusLabel(status) {
    const labels = {
        'pending': 'In Attesa',
        'confirmed': 'Confermato',
        'processing': 'In Lavorazione',
        'completed': 'Completato',
        'cancelled': 'Annullato'
    };
    return labels[status] || status;
}

function getContactStatusColor(status) {
    const colors = {
        'new': 'bg-cyan-500/20 text-cyan-400',
        'contacted': 'bg-blue-500/20 text-blue-400',
        'closed': 'bg-slate-500/20 text-slate-400'
    };
    return colors[status] || 'bg-slate-500/20 text-slate-400';
}

function getContactStatusLabel(status) {
    const labels = {
        'new': 'Nuovo',
        'contacted': 'Contattato',
        'closed': 'Chiuso'
    };
    return labels[status] || status;
}

function notify(message, type = 'info') {
    // Simple notification - could be enhanced with a toast library
    const colors = {
        'success': 'bg-green-500',
        'error': 'bg-red-500',
        'info': 'bg-cyan-500'
    };

    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// User Management Functions
async function toggleUserStatus(userId, newStatus) {
    if (!confirm(`Sei sicuro di voler ${newStatus ? 'attivare' : 'disattivare'} questo utente?`)) {
        return;
    }

    try {
        const response = await apiCall(`/api/auth/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: newStatus })
        });

        if (!response) return;

        notify('Stato utente aggiornato', 'success');
        loadUsers();

    } catch (error) {
        console.error('Toggle user status error:', error);
        notify('Errore aggiornamento stato utente', 'error');
    }
}

// Contact Management Functions
async function updateContactStatus(contactId, newStatus) {
    try {
        const response = await apiCall(`/api/contact/${contactId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response) return;

        notify('Stato contatto aggiornato', 'success');
        loadContacts();

    } catch (error) {
        console.error('Update contact status error:', error);
        notify('Errore aggiornamento stato contatto', 'error');
    }
}

async function viewContactDetails(contactId) {
    try {
        const response = await apiCall(`/api/contact/${contactId}`);
        if (!response) return;

        const data = await response.json();
        const contact = data.data;

        const details = `
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm text-slate-400">Nome</p>
                        <p class="font-medium">${contact.name}</p>
                    </div>
                    <div>
                        <p class="text-sm text-slate-400">Email</p>
                        <p class="font-medium">${contact.email}</p>
                    </div>
                    ${contact.company ? `
                    <div>
                        <p class="text-sm text-slate-400">Azienda</p>
                        <p class="font-medium">${contact.company}</p>
                    </div>
                    ` : ''}
                    ${contact.linkedin ? `
                    <div>
                        <p class="text-sm text-slate-400">LinkedIn</p>
                        <p class="font-medium"><a href="${contact.linkedin}" target="_blank" class="text-cyan-400 hover:underline">${contact.linkedin}</a></p>
                    </div>
                    ` : ''}
                    <div>
                        <p class="text-sm text-slate-400">Tipo Utente</p>
                        <p class="font-medium">${contact.user_type === 'COMPANY' ? 'Azienda' : 'Specialist'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-slate-400">Data Contatto</p>
                        <p class="font-medium">${new Date(contact.created_at).toLocaleString('it-IT')}</p>
                    </div>
                </div>
                <div>
                    <p class="text-sm text-slate-400 mb-2">Messaggio</p>
                    <p class="bg-slate-900 p-4 rounded-lg">${contact.message || 'Nessun messaggio'}</p>
                </div>
            </div>
        `;

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-slate-800 rounded-xl p-8 max-w-2xl w-full mx-4 border border-slate-700">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold">Dettagli Contatto</h2>
                    <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                ${details}
            </div>
        `;
        document.body.appendChild(modal);

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

    } catch (error) {
        console.error('View contact details error:', error);
        notify('Errore caricamento dettagli contatto', 'error');
    }
}

function getContactStatusBorderColor(status) {
    const colors = {
        'new': 'border-cyan-500',
        'contacted': 'border-blue-500',
        'closed': 'border-slate-500'
    };
    return colors[status] || 'border-slate-500';
}

function getContactStatusTextColor(status) {
    const colors = {
        'new': 'text-cyan-400',
        'contacted': 'text-blue-400',
        'closed': 'text-slate-400'
    };
    return colors[status] || 'text-slate-400';
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// Global arrays for filtering
let allProducts = [];
let allOrders = [];
let allUsers = [];
let allContacts = [];

// ========== ORGANIZATIONS MANAGEMENT ==========

let allOrganizations = [];

async function loadOrganizations() {
    try {
        const { page, perPage } = state.pagination.organizations;
        const offset = (page - 1) * perPage;
        const response = await apiCall(`/api/organizations?offset=${offset}&limit=${perPage}`);
        if (!response) return;

        const data = await response.json();
        const organizations = data.data.organizations || data.data || [];
        allOrganizations = organizations;

        displayOrganizations(allOrganizations);

        // Render pagination controls if pagination data is available
        if (data.pagination) {
            renderPaginationControls('organizations-pagination', 'organizations', data.pagination);
        } else if (data.data && data.data.total !== undefined) {
            // Build pagination from total count
            const totalPages = Math.ceil(data.data.total / perPage);
            renderPaginationControls('organizations-pagination', 'organizations', {
                page,
                limit: perPage,
                total: data.data.total,
                totalPages
            });
        }

    } catch (error) {
        console.error('Load organizations error:', error);
        notify('Errore caricamento organizzazioni', 'error');
    }
}

function displayOrganizations(organizations) {
    const tbody = document.getElementById('organizations-table-body');

    if (!organizations || organizations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center p-8 text-slate-400">Nessuna organizzazione trovata</td></tr>';
        return;
    }

    tbody.innerHTML = organizations.map(org => `
    <tr class="border-t border-slate-700 hover:bg-slate-700/50">
        <td class="p-4">${org.name || '-'}</td>
        <td class="p-4">${getOrgTypeBadge(org.organization_type)}</td>
        <td class="p-4">${org.vat_number || '-'}</td>
        <td class="p-4">${org.city || '-'}</td>
        <td class="p-4">${getOrgStatusBadge(org.status)}</td>
        <td class="p-4 text-sm text-slate-400">${formatDate(org.created_at)}</td>
        <td class="p-4">
            <div class="flex gap-2">
                <button onclick="openAuditingDashboard(${org.id})" class="text-green-400 hover:text-green-300" title="Apri Dashboard Auditing">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                </button>
                <button onclick="editOrganization(${org.id})" class="text-cyan-400 hover:text-cyan-300" title="Modifica">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                </button>
                <button onclick="deleteOrganization(${org.id})" class="text-red-400 hover:text-red-300" title="Elimina">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
        </td>
    </tr>
`).join('');
}

function filterOrganizations() {
    const nameFilter = document.getElementById('org-filter-name').value.toLowerCase();
    const typeFilter = document.getElementById('org-filter-type').value;
    const statusFilter = document.getElementById('org-filter-status').value;

    const filtered = allOrganizations.filter(org => {
        const matchName = !nameFilter || org.name.toLowerCase().includes(nameFilter);
        const matchType = !typeFilter || org.organization_type === typeFilter;
        const matchStatus = !statusFilter || org.status === statusFilter;
        return matchName && matchType && matchStatus;
    });

    displayOrganizations(filtered);
}

function resetOrganizationFilters() {
    document.getElementById('org-filter-name').value = '';
    document.getElementById('org-filter-type').value = '';
    document.getElementById('org-filter-status').value = '';
    displayOrganizations(allOrganizations);
}

function openOrganizationModal(org = null) {
    const modal = document.getElementById('organization-modal');
    const form = document.getElementById('organization-form');
    const title = document.getElementById('org-modal-title');

    form.reset();

    if (org) {
        title.textContent = 'Modifica Organizzazione';
        document.getElementById('org-id').value = org.id;
        document.getElementById('org-name').value = org.name || '';
        document.getElementById('org-type').value = org.organization_type || '';
        document.getElementById('org-email').value = org.email || '';
        document.getElementById('org-phone').value = org.phone || '';
        document.getElementById('org-vat').value = org.vat_number || '';
        document.getElementById('org-fiscal').value = org.fiscal_code || '';
        document.getElementById('org-address').value = org.address || '';
        document.getElementById('org-city').value = org.city || '';
        document.getElementById('org-province').value = org.province || '';
        document.getElementById('org-postal').value = org.postal_code || '';
        document.getElementById('org-status').value = org.status || 'pending';
    } else {
        title.textContent = 'Nuova Organizzazione';
        document.getElementById('org-id').value = '';
    }

    modal.classList.remove('hidden');
}

function closeOrganizationModal() {
    document.getElementById('organization-modal').classList.add('hidden');
}

async function editOrganization(id) {
    const org = allOrganizations.find(o => o.id === id);
    if (org) {
        openOrganizationModal(org);
    }
}

async function deleteOrganization(id) {
    if (!confirm('Sei sicuro di voler eliminare questa organizzazione?')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/organizations/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            notify('Organizzazione eliminata con successo', 'success');
            loadOrganizations();
        } else {
            notify(data.message || 'Errore eliminazione organizzazione', 'error');
        }
    } catch (error) {
        console.error('Delete organization error:', error);
        notify('Errore eliminazione organizzazione', 'error');
    }
}

async function saveOrganization(event) {
    event.preventDefault();

    const id = document.getElementById('org-id').value;
    const orgData = {
        name: document.getElementById('org-name').value,
        organizationType: document.getElementById('org-type').value,
        email: document.getElementById('org-email').value,
        phone: document.getElementById('org-phone').value || null,
        vatNumber: document.getElementById('org-vat').value || null,
        fiscalCode: document.getElementById('org-fiscal').value || null,
        address: document.getElementById('org-address').value || null,
        city: document.getElementById('org-city').value || null,
        province: document.getElementById('org-province').value || null,
        postalCode: document.getElementById('org-postal').value || null,
        status: document.getElementById('org-status').value
    };

    try {
        const token = localStorage.getItem('token');
        const url = id ? `${API_BASE}/api/organizations/${id}` : `${API_BASE}/api/organizations`;
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orgData)
        });

        const data = await response.json();

        if (data.success) {
            notify(id ? 'Organizzazione aggiornata con successo' : 'Organizzazione creata con successo', 'success');
            closeOrganizationModal();
            loadOrganizations();
        } else {
            notify(data.message || 'Errore salvataggio organizzazione', 'error');
        }
    } catch (error) {
        console.error('Save organization error:', error);
        notify('Errore salvataggio organizzazione', 'error');
    }
}

function getOrgTypeBadge(type) {
    const badges = {
        'PUBLIC_ENTITY': '<span class="px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">Ente Pubblico</span>',
        'PRIVATE_COMPANY': '<span class="px-2 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400">Azienda Privata</span>',
        'NON_PROFIT': '<span class="px-2 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400">No Profit</span>'
    };
    return badges[type] || '<span class="px-2 py-1 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-400">N/D</span>';
}

function getOrgStatusBadge(status) {
    const badges = {
        'pending': '<span class="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400">In attesa</span>',
        'active': '<span class="px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">Attivo</span>',
        'suspended': '<span class="px-2 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400">Sospeso</span>',
        'inactive': '<span class="px-2 py-1 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-400">Inattivo</span>'
    };
    return badges[status] || '<span class="px-2 py-1 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-400">N/D</span>';
}

// ========== SPECIALISTS MANAGEMENT ==========

let allSpecialists = [];

async function loadSpecialists() {
    try {
        const { page, perPage } = state.pagination.specialists;
        const offset = (page - 1) * perPage;
        const response = await apiCall(`/api/specialists?offset=${offset}&limit=${perPage}`);
        if (!response) return;

        const data = await response.json();
        const specialists = data.data.specialists || data.data || [];
        allSpecialists = specialists;

        displaySpecialists(allSpecialists);

        // Render pagination controls if pagination data is available
        if (data.pagination) {
            renderPaginationControls('specialists-pagination', 'specialists', data.pagination);
        } else if (data.data && data.data.total !== undefined) {
            // Build pagination from total count
            const totalPages = Math.ceil(data.data.total / perPage);
            renderPaginationControls('specialists-pagination', 'specialists', {
                page,
                limit: perPage,
                total: data.data.total,
                totalPages
            });
        }

    } catch (error) {
        console.error('Load specialists error:', error);
        notify('Errore caricamento specialist', 'error');
    }
}

function displaySpecialists(specialists) {
    const tbody = document.getElementById('specialists-table-body');

    if (!specialists || specialists.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center p-8 text-slate-400">Nessuno specialist trovato</td></tr>';
        return;
    }

    tbody.innerHTML = specialists.map(spec => `
    <tr class="border-t border-slate-700 hover:bg-slate-700/50">
        <td class="p-4">${spec.name || spec.user_name || '-'}</td>
        <td class="p-4 text-sm">${spec.email || spec.user_email || '-'}</td>
        <td class="p-4">${spec.experience_years || 0} anni</td>
        <td class="p-4">${spec.total_cpe_credits || 0}</td>
        <td class="p-4">${getSpecStatusBadge(spec.certification_status)}</td>
        <td class="p-4 text-sm text-slate-400">${spec.certification_date ? formatDate(spec.certification_date) : '-'}</td>
        <td class="p-4">
            <div class="flex gap-2">
                <button onclick="editSpecialist(${spec.id})" class="text-cyan-400 hover:text-cyan-300">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                </button>
                <button onclick="deleteSpecialist(${spec.id})" class="text-red-400 hover:text-red-300">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
        </td>
    </tr>
`).join('');
}

function filterSpecialists() {
    const nameFilter = document.getElementById('spec-filter-name').value.toLowerCase();
    const statusFilter = document.getElementById('spec-filter-status').value;

    const filtered = allSpecialists.filter(spec => {
        const name = spec.name || spec.user_name || '';
        const email = spec.email || spec.user_email || '';
        const matchName = !nameFilter || name.toLowerCase().includes(nameFilter) || email.toLowerCase().includes(nameFilter);
        const matchStatus = !statusFilter || spec.certification_status === statusFilter;
        return matchName && matchStatus;
    });

    displaySpecialists(filtered);
}

function resetSpecialistFilters() {
    document.getElementById('spec-filter-name').value = '';
    document.getElementById('spec-filter-status').value = '';
    displaySpecialists(allSpecialists);
}

function openSpecialistModal(spec = null) {
    const modal = document.getElementById('specialist-modal');
    const form = document.getElementById('specialist-form');
    const title = document.getElementById('spec-modal-title');

    form.reset();

    if (spec) {
        title.textContent = 'Modifica Specialist';
        document.getElementById('spec-id').value = spec.id;
        document.getElementById('spec-name').value = spec.name || spec.user_name || '';
        document.getElementById('spec-email').value = spec.email || spec.user_email || '';
        document.getElementById('spec-experience').value = spec.experience_years || 0;
        document.getElementById('spec-status-input').value = spec.certification_status || 'pending';
        document.getElementById('spec-bio').value = spec.bio || '';
        document.getElementById('spec-cpe').value = spec.total_cpe_credits || 0;
        document.getElementById('spec-cert-date').value = spec.certification_date ? spec.certification_date.split('T')[0] : '';
    } else {
        title.textContent = 'Nuovo Specialist';
        document.getElementById('spec-id').value = '';
    }

    modal.classList.remove('hidden');
}

function closeSpecialistModal() {
    document.getElementById('specialist-modal').classList.add('hidden');
}

async function editSpecialist(id) {
    const spec = allSpecialists.find(s => s.id === id);
    if (spec) {
        openSpecialistModal(spec);
    }
}

async function deleteSpecialist(id) {
    if (!confirm('Sei sicuro di voler eliminare questo specialist?')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/specialists/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            notify('Specialist eliminato con successo', 'success');
            loadSpecialists();
        } else {
            notify(data.message || 'Errore eliminazione specialist', 'error');
        }
    } catch (error) {
        console.error('Delete specialist error:', error);
        notify('Errore eliminazione specialist', 'error');
    }
}

async function saveSpecialist(event) {
    event.preventDefault();

    const id = document.getElementById('spec-id').value;
    const specData = {
        name: document.getElementById('spec-name').value,
        email: document.getElementById('spec-email').value,
        experienceYears: parseInt(document.getElementById('spec-experience').value),
        certificationStatus: document.getElementById('spec-status-input').value,
        bio: document.getElementById('spec-bio').value || null,
        totalCpeCredits: parseFloat(document.getElementById('spec-cpe').value) || 0,
        certificationDate: document.getElementById('spec-cert-date').value || null
    };

    try {
        const token = localStorage.getItem('token');
        const url = id ? `${API_BASE}/api/specialists/${id}` : `${API_BASE}/api/specialists`;
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(specData)
        });

        const data = await response.json();

        if (data.success) {
            notify(id ? 'Specialist aggiornato con successo' : 'Specialist creato con successo', 'success');
            closeSpecialistModal();
            loadSpecialists();
        } else {
            notify(data.message || 'Errore salvataggio specialist', 'error');
        }
    } catch (error) {
        console.error('Save specialist error:', error);
        notify('Errore salvataggio specialist', 'error');
    }
}

function getSpecStatusBadge(status) {
    const badges = {
        'pending': '<span class="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400">Candidato</span>',
        'certified': '<span class="px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">Certificato</span>',
        'suspended': '<span class="px-2 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400">Sospeso</span>',
        'expired': '<span class="px-2 py-1 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-400">Scaduto</span>'
    };
    return badges[status] || '<span class="px-2 py-1 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-400">N/D</span>';
}

// ========== CPF AUDITING DASHBOARD ==========

/**
 * Open CPF Auditing Dashboard for an organization
 * Opens in a new tab with organization ID in URL hash
 */
function openAuditingDashboard(organizationId) {
    const dashboardUrl = `dashboard/auditing/index.html#organization/${organizationId}`;
    window.open(dashboardUrl, '_blank');
}
