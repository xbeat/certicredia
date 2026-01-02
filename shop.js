// CertiCredia Shop JavaScript
const API = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';
const state = { user: null, cart: [], products: [] };

function getToken() { return localStorage.getItem('token'); }
function setToken(t) { localStorage.setItem('token', t); }
function removeToken() { localStorage.removeItem('token'); }

async function api(endpoint, opts = {}) {
    const token = getToken();
    const res = await fetch(API + endpoint, {
        ...opts,
        headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }), ...opts.headers },
        credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error');
    return data;
}

async function register(form) { const d = await api('/auth/register', { method: 'POST', body: JSON.stringify(form) }); if (d.data?.accessToken) { setToken(d.data.accessToken); state.user = d.data.user; } return d; }
async function login(form) { const d = await api('/auth/login', { method: 'POST', body: JSON.stringify(form) }); if (d.data?.accessToken) { setToken(d.data.accessToken); state.user = d.data.user; } return d; }
async function logout() { await api('/auth/logout', { method: 'POST' }); removeToken(); state.user = null; location.href = '/'; }
async function getProfile() { const d = await api('/auth/profile'); if (d.success) state.user = d.data; return d; }
async function forgotPassword(email) { return await api('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }); }
async function resetPassword(email, token, newPassword) { return await api('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, token, newPassword }) }); }
async function getProducts() { const d = await api('/products'); if (d.success) state.products = d.data; return d; }
async function getCart() { const d = await api('/cart'); if (d.success) state.cart = d.data; return d; }
async function addToCart(pid, qty = 1) { return await api('/cart', { method: 'POST', body: JSON.stringify({ product_id: pid, quantity: qty }) }); }
async function updateCartItem(id, qty) { return await api(`/cart/${id}`, { method: 'PUT', body: JSON.stringify({ quantity: qty }) }); }
async function removeFromCart(id) { return await api(`/cart/${id}`, { method: 'DELETE' }); }
async function createOrder(data) { return await api('/orders', { method: 'POST', body: JSON.stringify(data) }); }
async function getOrders() { const d = await api('/orders'); if (d.success) state.orders = d.data; return d; }

function notify(msg, type = 'info') {
    const n = document.createElement('div');
    n.className = 'fixed top-24 right-6 z-50 animate-slide-in';
    const bg = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-cyan-500';
    n.innerHTML = `<div class="${bg} text-white px-6 py-4 rounded-lg shadow-2xl">${msg}</div>`;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 5000);
}

function price(p) {
    const formatted = parseFloat(p).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `€${formatted}`;
}
function updateCartBadge(c) {
    const badges = ['cart-badge', 'cart-badge-mobile'];
    badges.forEach(id => {
        const b = document.getElementById(id);
        if (b) {
            b.textContent = c;
            b.classList.toggle('hidden', c === 0);
        }
    });
}
function updateAuthUI() {
    const targets = ['auth-buttons', 'auth-buttons-mobile', 'auth-nav'];
    targets.forEach(targetId => {
        const target = document.getElementById(targetId);
        if (!target) return;
        target.innerHTML = getToken() && state.user ?
        `<div class="relative group">
            <button class="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 transition-all">
                <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                <span class="text-white font-medium">${state.user.name}</span>
                <svg class="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </button>
            <div class="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div class="py-2">
                    <a href="/dashboard.html" class="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                        </svg>
                        <span class="font-medium">Dashboard</span>
                    </a>
                    <a href="/public/pages/profile.html" class="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        <span class="font-medium">Profilo</span>
                    </a>
                    <div class="border-t border-slate-700 my-2"></div>
                    <button onclick="handleLogout()" class="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                        </svg>
                        <span class="font-medium">Logout</span>
                    </button>
                </div>
            </div>
        </div>` :
        `<a href="/public/pages/app-landing.html" class="btn-outline">Accedi</a>`;
    });
}

// Mobile menu toggle
function initMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const langSwitcher = document.getElementById('lang-switcher');
    const langSwitcherMobile = document.getElementById('lang-switcher-mobile');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Clone lang switcher to mobile if exists
    if (langSwitcher && langSwitcherMobile && langSwitcher.innerHTML) {
        langSwitcherMobile.innerHTML = langSwitcher.innerHTML;
    }
}

async function initShop() {
    const grid = document.getElementById('products-grid'), loading = document.getElementById('loading');
    if (!grid) return;
    try {
        const d = await getProducts();
        loading?.classList.add('hidden');
        grid.innerHTML = d.data.map(p => `
            <div class="bg-slate-800 rounded-xl overflow-hidden hover:ring-2 ring-cyan-500 transition">
                <div class="aspect-video bg-slate-700 flex items-center justify-center">
                    <svg class="w-12 h-12 md:w-16 md:h-16 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                    </svg>
                </div>
                <div class="p-4 md:p-6">
                    <span class="text-xs text-cyan-400 font-semibold uppercase tracking-wide">${p.category || 'ISO'}</span>
                    <h3 class="text-lg md:text-xl font-bold my-2">${p.name || 'Certificazione'}</h3>
                    <p class="text-slate-400 text-sm mb-4 min-h-[40px]">${p.short_description || ''}</p>
                    <div class="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                        <span class="text-xl md:text-2xl font-bold text-cyan-400">${price(p.price)}</span>
                        <button onclick="handleAddToCart(${p.id})" class="btn-primary w-full sm:w-auto">Aggiungi</button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (e) { loading?.classList.add('hidden'); notify(e.message, 'error'); }
}

async function handleAddToCart(pid) {
    try { await addToCart(pid); const c = await getCart(); updateCartBadge(c.count); notify('Aggiunto al carrello!', 'success'); }
    catch (e) { notify(e.message, 'error'); }
}

async function initCart() {
    const items = document.getElementById('cart-items'), empty = document.getElementById('cart-empty');
    if (!items) return;
    try {
        const d = await getCart();
        if (d.count === 0) { items.classList.add('hidden'); empty?.classList.remove('hidden'); return; }
        items.innerHTML = d.data.map(i => `
            <div class="bg-slate-800 rounded-xl p-6 flex gap-6">
                <div class="flex-1">
                    <h3 class="text-lg font-bold">${i.name}</h3>
                    <div class="mt-4 flex items-center gap-4">
                        <button onclick="updateQty(${i.id}, ${i.quantity - 1})" class="w-8 h-8 bg-slate-700 rounded">-</button>
                        <span>${i.quantity}</span>
                        <button onclick="updateQty(${i.id}, ${i.quantity + 1})" class="w-8 h-8 bg-slate-700 rounded">+</button>
                        <span class="text-xl font-bold text-cyan-400">${price(i.total_price)}</span>
                    </div>
                </div>
                <button onclick="handleRemoveCart(${i.id})" class="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-colors" title="Rimuovi dal carrello">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
        `).join('');
        document.getElementById('cart-subtotal').textContent = price(d.totalAmount);
        document.getElementById('cart-tax').textContent = price(d.totalAmount * 0.22);
        document.getElementById('cart-total').textContent = price(d.totalAmount * 1.22);
    } catch (e) { notify(e.message, 'error'); }
}

async function updateQty(id, qty) { if (qty < 1) return; try { await updateCartItem(id, qty); await initCart(); } catch (e) { notify(e.message, 'error'); } }
async function handleRemoveCart(id) { try { await removeFromCart(id); await initCart(); notify('Rimosso', 'success'); } catch (e) { notify(e.message, 'error'); } }

function initAuth() {
    const lt = document.getElementById('tab-login'), rt = document.getElementById('tab-register');
    const lf = document.getElementById('login-form'), rf = document.getElementById('register-form');
    const resetSection = document.getElementById('reset-password-section');
    const forgotLink = document.getElementById('forgot-password-link');
    const backLink = document.getElementById('back-to-login-link');
    const sendResetBtn = document.getElementById('send-reset-btn');
    const resetPasswordBtn = document.getElementById('reset-password-btn');

    if (!lt) return;

    lt.onclick = () => { lt.className = 'flex-1 py-2 rounded-md bg-cyan-500 text-white font-medium'; rt.className = 'flex-1 py-2 rounded-md text-slate-400'; lf.classList.remove('hidden'); rf.classList.add('hidden'); resetSection.classList.add('hidden'); };
    rt.onclick = () => { rt.className = 'flex-1 py-2 rounded-md bg-cyan-500 text-white font-medium'; lt.className = 'flex-1 py-2 rounded-md text-slate-400'; rf.classList.remove('hidden'); lf.classList.add('hidden'); resetSection.classList.add('hidden'); };
    lf.onsubmit = async (e) => { e.preventDefault(); try { await login(Object.fromEntries(new FormData(e.target))); notify('Login OK!', 'success'); setTimeout(() => location.href = '/dashboard.html', 1000); } catch (er) { notify(er.message, 'error'); } };
    rf.onsubmit = async (e) => { e.preventDefault(); try { await register(Object.fromEntries(new FormData(e.target))); notify('Registrato!', 'success'); setTimeout(() => location.href = '/dashboard.html', 1000); } catch (er) { notify(er.message, 'error'); } };

    forgotLink?.addEventListener('click', (e) => { e.preventDefault(); lf.classList.add('hidden'); rf.classList.add('hidden'); resetSection.classList.remove('hidden'); });
    backLink?.addEventListener('click', (e) => { e.preventDefault(); resetSection.classList.add('hidden'); lf.classList.remove('hidden'); document.getElementById('reset-step-1').classList.remove('hidden'); document.getElementById('reset-step-2').classList.add('hidden'); });

    sendResetBtn?.addEventListener('click', async () => {
        const email = document.getElementById('reset-email').value;
        if (!email) { notify('Inserisci email', 'error'); return; }
        try {
            await forgotPassword(email);
            notify('Codice inviato! Controlla la tua email', 'success');
            document.getElementById('reset-step-1').classList.add('hidden');
            document.getElementById('reset-step-2').classList.remove('hidden');
        } catch (er) { notify(er.message, 'error'); }
    });

    resetPasswordBtn?.addEventListener('click', async () => {
        const email = document.getElementById('reset-email').value;
        const token = document.getElementById('reset-token').value;
        const newPassword = document.getElementById('reset-new-password').value;
        if (!token || !newPassword) { notify('Compila tutti i campi', 'error'); return; }
        try {
            await resetPassword(email, token, newPassword);
            notify('Password reimpostata! Effettua il login', 'success');
            setTimeout(() => { resetSection.classList.add('hidden'); lf.classList.remove('hidden'); document.getElementById('reset-step-1').classList.remove('hidden'); document.getElementById('reset-step-2').classList.add('hidden'); }, 1500);
        } catch (er) { notify(er.message, 'error'); }
    });
}

async function initCheckout() {
    const form = document.getElementById('checkout-form');
    if (!form || !getToken()) { location.href = '/public/pages/app-landing.html'; return; }
    try {
        const [cart, user] = await Promise.all([getCart(), getProfile()]);
        if (cart.count === 0) { location.href = '/cart.html'; return; }
        if (user.data) {
            form.billing_name.value = user.data.name || '';
            form.billing_email.value = user.data.email || '';
            form.billing_phone.value = user.data.phone || '';
        }
        document.getElementById('order-summary').innerHTML = cart.data.map(i => `<div class="flex justify-between text-sm"><span>${i.name} x${i.quantity}</span><span>${price(i.total_price)}</span></div>`).join('');
        document.getElementById('order-total').textContent = price(cart.totalAmount);
    } catch (e) { notify(e.message, 'error'); }
    form.onsubmit = async (e) => { e.preventDefault(); try { await createOrder(Object.fromEntries(new FormData(e.target))); notify('Ordine creato!', 'success'); setTimeout(() => location.href = '/dashboard.html', 2000); } catch (er) { notify(er.message, 'error'); } };
}

async function initDashboard() {
    if (!getToken()) { location.href = '/public/pages/app-landing.html'; return; }
    try {
        const [user, orders] = await Promise.all([getProfile(), getOrders()]);

        // Update user name in header
        const userName = document.getElementById('user-name');
        if (userName) userName.textContent = user.data.name || user.data.email;

        // Calculate stats
        const totalOrders = orders.count || 0;
        const totalSpent = orders.data.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
        const avgOrder = totalOrders > 0 ? totalSpent / totalOrders : 0;

        document.getElementById('total-orders').textContent = totalOrders;
        if (document.getElementById('total-spent')) document.getElementById('total-spent').textContent = price(totalSpent);
        if (document.getElementById('avg-order')) document.getElementById('avg-order').textContent = price(avgOrder);

        const ol = document.getElementById('orders-list');
        if (orders.count === 0) { ol.classList.add('hidden'); document.getElementById('no-orders')?.classList.remove('hidden'); }
        else {
            ol.innerHTML = orders.data.map(o => `<div class="bg-slate-700 rounded-lg p-4 flex justify-between"><div><div class="font-bold">${o.order_number}</div><div class="text-sm text-slate-400">${new Date(o.created_at).toLocaleDateString('it-IT')}</div></div><div class="text-right"><div class="font-bold text-cyan-400">${price(o.total_amount)}</div><div class="text-xs text-slate-400 capitalize">${o.status}</div></div></div>`).join('');
        }

        // Update profile info
        document.getElementById('user-email').textContent = user.data.email || '-';
        document.getElementById('user-phone').textContent = user.data.phone || '-';
        document.getElementById('user-company').textContent = user.data.company || '-';
        const address = [user.data.address, user.data.city, user.data.postal_code].filter(Boolean).join(', ');
        document.getElementById('user-address').textContent = address || '-';
    } catch (e) { notify(e.message, 'error'); }
}

async function handleLogout() { try { await logout(); } catch { removeToken(); location.href = '/'; } }
window.handleAddToCart = handleAddToCart;
window.handleRemoveCart = handleRemoveCart;
window.updateQty = updateQty;
window.handleLogout = handleLogout;

async function init() {
    if (getToken()) { try { await getProfile(); } catch { removeToken(); } }
    updateAuthUI();
    initMobileMenu();
    try { const c = await getCart(); updateCartBadge(c.count); } catch {}
    const p = location.pathname;
    if (p.includes('shop.html') || p === '/shop') await initShop();
    else if (p.includes('cart.html')) await initCart();
    else if (p.includes('app-landing.html')) initAuth();
    else if (p.includes('checkout.html')) await initCheckout();
    else if (p.includes('dashboard.html')) await initDashboard();
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
}

document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
