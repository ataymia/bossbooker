/**
 * Boss Booker - Admin Portal JavaScript
 * 
 * Full admin dashboard with:
 * - Password authentication (sessionStorage)
 * - Dashboard with stats and charts
 * - Visitor, Event, Lead, and Plan Request management
 * - Data export (JSON/CSV)
 * - Settings management
 */

(function() {
    'use strict';

    // =========================================
    // CONFIGURATION
    // =========================================
    const CONFIG = {
        PASSWORD: 'neversleep',
        MAX_LOGIN_ATTEMPTS: 5,
        LOCKOUT_KEY: 'bb_admin_lockout',
        SESSION_KEY: 'bb_admin_session',
        ATTEMPT_KEY: 'bb_admin_attempts'
    };

    // =========================================
    // STATE
    // =========================================
    let state = {
        currentTab: 'dashboard',
        searchFilters: {
            visitors: '',
            events: '',
            leads: '',
            planRequests: ''
        },
        statusFilters: {
            leads: 'all',
            planRequests: 'all'
        }
    };

    // =========================================
    // DOM ELEMENTS
    // =========================================
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // =========================================
    // INITIALIZATION
    // =========================================
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        // Check if locked out
        if (isLockedOut()) {
            showLockoutError();
            return;
        }

        // Check if already authenticated
        if (isAuthenticated()) {
            showDashboard();
        } else {
            showLoginScreen();
        }
    }

    // =========================================
    // AUTHENTICATION
    // =========================================
    function isAuthenticated() {
        return sessionStorage.getItem(CONFIG.SESSION_KEY) === 'true';
    }

    function isLockedOut() {
        const lockoutTime = localStorage.getItem(CONFIG.LOCKOUT_KEY);
        if (!lockoutTime) return false;
        
        const lockoutEnd = parseInt(lockoutTime, 10);
        if (Date.now() < lockoutEnd) {
            return true;
        } else {
            // Lockout expired, clear it
            localStorage.removeItem(CONFIG.LOCKOUT_KEY);
            localStorage.removeItem(CONFIG.ATTEMPT_KEY);
            return false;
        }
    }

    function getLoginAttempts() {
        return parseInt(localStorage.getItem(CONFIG.ATTEMPT_KEY) || '0', 10);
    }

    function incrementLoginAttempts() {
        const attempts = getLoginAttempts() + 1;
        localStorage.setItem(CONFIG.ATTEMPT_KEY, attempts.toString());
        
        if (attempts >= CONFIG.MAX_LOGIN_ATTEMPTS) {
            // Lock out for 15 minutes
            const lockoutEnd = Date.now() + (15 * 60 * 1000);
            localStorage.setItem(CONFIG.LOCKOUT_KEY, lockoutEnd.toString());
        }
        
        return attempts;
    }

    function clearLoginAttempts() {
        localStorage.removeItem(CONFIG.ATTEMPT_KEY);
    }

    function handleLogin(e) {
        e.preventDefault();
        
        if (isLockedOut()) {
            showLockoutError();
            return;
        }

        const passwordInput = $('#login-password');
        const password = passwordInput.value.trim().toLowerCase();
        const errorEl = $('#login-error');

        if (password === CONFIG.PASSWORD.toLowerCase()) {
            // Success!
            sessionStorage.setItem(CONFIG.SESSION_KEY, 'true');
            clearLoginAttempts();
            showDashboard();
        } else {
            // Failed
            const attempts = incrementLoginAttempts();
            const remaining = CONFIG.MAX_LOGIN_ATTEMPTS - attempts;
            
            if (remaining <= 0) {
                showLockoutError();
            } else {
                errorEl.textContent = `Invalid password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`;
                errorEl.style.display = 'block';
            }
            
            passwordInput.value = '';
            passwordInput.focus();
        }
    }

    function handleLogout() {
        sessionStorage.removeItem(CONFIG.SESSION_KEY);
        window.location.reload();
    }

    function showLockoutError() {
        const lockoutTime = localStorage.getItem(CONFIG.LOCKOUT_KEY);
        const lockoutEnd = parseInt(lockoutTime, 10);
        const remaining = Math.ceil((lockoutEnd - Date.now()) / 60000);
        
        const errorEl = $('#login-error');
        if (errorEl) {
            errorEl.textContent = `Too many failed attempts. Please try again in ${remaining} minute${remaining !== 1 ? 's' : ''}.`;
            errorEl.style.display = 'block';
        }
        
        const passwordInput = $('#login-password');
        const loginBtn = $('#login-btn');
        if (passwordInput) passwordInput.disabled = true;
        if (loginBtn) loginBtn.disabled = true;
    }

    // =========================================
    // VIEW SWITCHING
    // =========================================
    function showLoginScreen() {
        const loginScreen = $('#login-screen');
        const dashboard = $('#admin-dashboard');
        
        if (loginScreen) loginScreen.style.display = 'flex';
        if (dashboard) dashboard.style.display = 'none';
        
        // Attach login handler
        const loginForm = $('#login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
    }

    function showDashboard() {
        const loginScreen = $('#login-screen');
        const dashboard = $('#admin-dashboard');
        
        if (loginScreen) loginScreen.style.display = 'none';
        if (dashboard) dashboard.style.display = 'flex';
        
        // Initialize dashboard
        initDashboard();
    }

    // =========================================
    // DASHBOARD INITIALIZATION
    // =========================================
    function initDashboard() {
        // Set up navigation
        initNavigation();
        
        // Set up logout
        const logoutBtn = $('#logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
        
        // Set up refresh button
        const refreshBtn = $('#refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', refreshData);
        }
        
        // Set up modals
        initModals();
        
        // Set up exports
        initExports();
        
        // Set up danger zone
        initDangerZone();
        
        // Load initial data
        refreshData();
        
        // Update "last updated" timestamp
        updateLastUpdated();
        
        // Show dashboard tab by default
        switchTab('dashboard');
    }

    function initNavigation() {
        const navItems = $$('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                if (tab) {
                    switchTab(tab);
                }
            });
        });
    }

    function switchTab(tabName) {
        state.currentTab = tabName;
        
        // Update nav items
        $$('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tabName);
        });
        
        // Update tab content
        $$('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabName}`);
        });
        
        // Update header title
        const titles = {
            dashboard: 'Dashboard',
            visitors: 'Visitors',
            events: 'Events',
            leads: 'Leads',
            'plan-requests': 'Plan Requests',
            exports: 'Export Data',
            settings: 'Settings'
        };
        const headerTitle = $('#header-title');
        if (headerTitle) {
            headerTitle.textContent = titles[tabName] || 'Dashboard';
        }
        
        // Refresh data for the tab
        refreshTabData(tabName);
    }

    function refreshData() {
        refreshTabData(state.currentTab);
        updateLastUpdated();
    }

    function refreshTabData(tabName) {
        switch (tabName) {
            case 'dashboard':
                renderDashboard();
                break;
            case 'visitors':
                renderVisitorsTable();
                break;
            case 'events':
                renderEventsTable();
                break;
            case 'leads':
                renderLeadsTable();
                break;
            case 'plan-requests':
                renderPlanRequestsTable();
                break;
            case 'settings':
                renderSettings();
                break;
        }
    }

    function updateLastUpdated() {
        const el = $('#last-updated');
        if (el) {
            el.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
        }
    }

    // =========================================
    // DASHBOARD TAB
    // =========================================
    function renderDashboard() {
        if (typeof DataStore === 'undefined') {
            console.warn('DataStore not available');
            return;
        }
        
        const stats = DataStore.getDashboardStats();
        
        // Update stat cards
        updateStatCard('stat-visitors', stats.uniqueVisitors);
        updateStatCard('stat-sessions', stats.totalSessions);
        updateStatCard('stat-pageviews', stats.totalPageViews);
        updateStatCard('stat-conversions', stats.totalLeads + stats.totalPlanRequests);
        
        // Render top pages chart
        renderTopPagesChart(stats.topPages);
        
        // Render conversions
        renderConversions(stats);
        
        // Render referrers
        renderReferrers(stats.topReferrers);
        
        // Render recent activity
        renderRecentActivity();
        
        // Update nav badges
        updateNavBadges(stats);
    }

    function updateStatCard(id, value) {
        const el = $(`#${id}`);
        if (el) {
            el.textContent = formatNumber(value);
        }
    }

    function renderTopPagesChart(topPages) {
        const container = $('#top-pages-chart');
        if (!container) return;
        
        if (!topPages || topPages.length === 0) {
            container.innerHTML = '<p class="empty-state">No page data yet</p>';
            return;
        }
        
        const maxViews = Math.max(...topPages.map(p => p.views));
        
        container.innerHTML = topPages.slice(0, 5).map(page => `
            <div class="bar-item">
                <span class="bar-label" title="${page.page}">${page.page}</span>
                <div class="bar-track">
                    <div class="bar-fill" style="width: ${(page.views / maxViews * 100).toFixed(1)}%"></div>
                </div>
                <span class="bar-value">${formatNumber(page.views)}</span>
            </div>
        `).join('');
    }

    function renderConversions(stats) {
        const container = $('#conversions-list');
        if (!container) return;
        
        container.innerHTML = `
            <div class="conversion-item">
                <span>Contact Leads</span>
                <span>${formatNumber(stats.totalLeads)}</span>
            </div>
            <div class="conversion-item">
                <span>Plan Requests</span>
                <span>${formatNumber(stats.totalPlanRequests)}</span>
            </div>
            <div class="conversion-item">
                <span>Quiz Completions</span>
                <span>${formatNumber(stats.quizCompletions || 0)}</span>
            </div>
        `;
    }

    function renderReferrers(referrers) {
        const container = $('#referrers-list');
        if (!container) return;
        
        if (!referrers || referrers.length === 0) {
            container.innerHTML = '<p class="empty-state">No referrer data yet</p>';
            return;
        }
        
        const maxCount = Math.max(...referrers.map(r => r.count));
        
        container.innerHTML = referrers.slice(0, 5).map(ref => `
            <div class="bar-item">
                <span class="bar-label" title="${ref.referrer}">${ref.referrer || 'Direct'}</span>
                <div class="bar-track">
                    <div class="bar-fill" style="width: ${(ref.count / maxCount * 100).toFixed(1)}%"></div>
                </div>
                <span class="bar-value">${formatNumber(ref.count)}</span>
            </div>
        `).join('');
    }

    function renderRecentActivity() {
        const container = $('#recent-activity');
        if (!container) return;
        
        const events = DataStore.listEvents().slice(0, 20);
        
        if (events.length === 0) {
            container.innerHTML = '<p class="empty-state">No recent activity</p>';
            return;
        }
        
        container.innerHTML = events.map(event => {
            const dotClass = event.eventType || 'default';
            const time = formatRelativeTime(event.timestamp);
            const text = formatEventText(event);
            
            return `
                <div class="activity-item">
                    <span class="activity-dot ${dotClass}"></span>
                    <span class="activity-text">${text}</span>
                    <span class="activity-time">${time}</span>
                </div>
            `;
        }).join('');
    }

    function updateNavBadges(stats) {
        const leadsNew = DataStore.listLeads().filter(l => l.status === 'new').length;
        const plansNew = DataStore.listPlanRequests().filter(p => p.status === 'new').length;
        
        const leadsBadge = $('#badge-leads');
        const plansBadge = $('#badge-plans');
        
        if (leadsBadge) {
            leadsBadge.textContent = leadsNew;
            leadsBadge.style.display = leadsNew > 0 ? 'inline' : 'none';
        }
        
        if (plansBadge) {
            plansBadge.textContent = plansNew;
            plansBadge.style.display = plansNew > 0 ? 'inline' : 'none';
        }
    }

    // =========================================
    // VISITORS TAB
    // =========================================
    function renderVisitorsTable() {
        const container = $('#visitors-table-body');
        const countEl = $('#visitors-count');
        if (!container) return;
        
        const visitors = DataStore.listVisitors();
        const filtered = filterData(visitors, state.searchFilters.visitors, ['visitorId', 'userAgent', 'referrer']);
        
        if (countEl) {
            countEl.textContent = `${filtered.length} visitor${filtered.length !== 1 ? 's' : ''}`;
        }
        
        if (filtered.length === 0) {
            container.innerHTML = '<tr><td colspan="5" class="empty-state">No visitors yet</td></tr>';
            return;
        }
        
        container.innerHTML = filtered.map(v => `
            <tr>
                <td><code style="font-size: 10px;">${v.visitorId?.substring(0, 8) || 'Unknown'}...</code></td>
                <td>${formatDate(v.firstSeen)}</td>
                <td>${formatDate(v.lastSeen)}</td>
                <td>${v.sessions || 1}</td>
                <td>${v.pageViews || 0}</td>
            </tr>
        `).join('');
        
        // Set up search
        initTableSearch('visitors-search', 'visitors');
    }

    // =========================================
    // EVENTS TAB
    // =========================================
    function renderEventsTable() {
        const container = $('#events-table-body');
        const countEl = $('#events-count');
        if (!container) return;
        
        const events = DataStore.listEvents();
        const typeFilter = state.statusFilters.events;
        let filtered = events;
        
        if (typeFilter && typeFilter !== 'all') {
            filtered = filtered.filter(e => e.eventType === typeFilter);
        }
        
        filtered = filterData(filtered, state.searchFilters.events, ['eventType', 'page', 'data']);
        
        if (countEl) {
            countEl.textContent = `${filtered.length} event${filtered.length !== 1 ? 's' : ''}`;
        }
        
        if (filtered.length === 0) {
            container.innerHTML = '<tr><td colspan="5" class="empty-state">No events yet</td></tr>';
            return;
        }
        
        container.innerHTML = filtered.slice(0, 100).map(e => {
            const typeClass = e.eventType || '';
            const dataStr = e.data ? JSON.stringify(e.data).substring(0, 50) : '-';
            
            return `
                <tr>
                    <td>${formatDateTime(e.timestamp)}</td>
                    <td><span class="event-type ${typeClass}">${e.eventType || 'unknown'}</span></td>
                    <td>${e.page || '-'}</td>
                    <td title="${escapeHtml(JSON.stringify(e.data || {}))}">${escapeHtml(dataStr)}</td>
                    <td><code style="font-size: 10px;">${e.visitorId?.substring(0, 8) || '?'}...</code></td>
                </tr>
            `;
        }).join('');
        
        // Set up search and filter
        initTableSearch('events-search', 'events');
        initTypeFilter();
    }

    function initTypeFilter() {
        const select = $('#events-type-filter');
        if (!select) return;
        
        select.addEventListener('change', (e) => {
            state.statusFilters.events = e.target.value;
            renderEventsTable();
        });
    }

    // =========================================
    // LEADS TAB
    // =========================================
    function renderLeadsTable() {
        const container = $('#leads-table-body');
        const countEl = $('#leads-count');
        if (!container) return;
        
        const leads = DataStore.listLeads();
        const statusFilter = state.statusFilters.leads;
        let filtered = leads;
        
        if (statusFilter && statusFilter !== 'all') {
            filtered = filtered.filter(l => l.status === statusFilter);
        }
        
        filtered = filterData(filtered, state.searchFilters.leads, ['name', 'email', 'phone', 'message']);
        
        if (countEl) {
            countEl.textContent = `${filtered.length} lead${filtered.length !== 1 ? 's' : ''}`;
        }
        
        if (filtered.length === 0) {
            container.innerHTML = '<tr><td colspan="6" class="empty-state">No leads yet</td></tr>';
            return;
        }
        
        container.innerHTML = filtered.map(lead => `
            <tr>
                <td>${formatDateTime(lead.createdAt)}</td>
                <td>${escapeHtml(lead.name || '-')}</td>
                <td>
                    ${lead.email ? `<a href="mailto:${escapeHtml(lead.email)}">${escapeHtml(lead.email)}</a>` : '-'}
                </td>
                <td>
                    ${lead.phone ? `<a href="tel:${escapeHtml(lead.phone)}">${escapeHtml(lead.phone)}</a>` : '-'}
                </td>
                <td><span class="status-badge ${lead.status || 'new'}">${lead.status || 'new'}</span></td>
                <td>
                    <button class="action-btn" onclick="window.AdminApp.viewLead('${lead.id}')">View</button>
                </td>
            </tr>
        `).join('');
        
        // Set up search and filter
        initTableSearch('leads-search', 'leads');
        initLeadsStatusFilter();
    }

    function initLeadsStatusFilter() {
        const select = $('#leads-status-filter');
        if (!select) return;
        
        select.removeEventListener('change', handleLeadsStatusChange);
        select.addEventListener('change', handleLeadsStatusChange);
    }

    function handleLeadsStatusChange(e) {
        state.statusFilters.leads = e.target.value;
        renderLeadsTable();
    }

    function viewLead(id) {
        const leads = DataStore.listLeads();
        const lead = leads.find(l => l.id === id);
        if (!lead) return;
        
        const modal = $('#detail-modal');
        const title = $('#detail-modal-title');
        const body = $('#detail-modal-body');
        
        if (!modal || !body) return;
        
        title.textContent = 'Lead Details';
        
        body.innerHTML = `
            <div class="detail-grid">
                <div class="detail-row">
                    <span class="detail-label">Name</span>
                    <span class="detail-value">${escapeHtml(lead.name || '-')}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Email</span>
                    <span class="detail-value">
                        ${lead.email ? `<a href="mailto:${escapeHtml(lead.email)}">${escapeHtml(lead.email)}</a>` : '-'}
                    </span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Phone</span>
                    <span class="detail-value">
                        ${lead.phone ? `<a href="tel:${escapeHtml(lead.phone)}">${escapeHtml(lead.phone)}</a>` : '-'}
                    </span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Submitted</span>
                    <span class="detail-value">${formatDateTime(lead.createdAt)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Source</span>
                    <span class="detail-value">${escapeHtml(lead.source || 'Unknown')}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Message</span>
                    <span class="detail-value">${escapeHtml(lead.message || '-')}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Status</span>
                    <select class="form-control status-select" id="lead-status-select">
                        <option value="new" ${lead.status === 'new' ? 'selected' : ''}>New</option>
                        <option value="contacted" ${lead.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                        <option value="booked" ${lead.status === 'booked' ? 'selected' : ''}>Booked</option>
                        <option value="archived" ${lead.status === 'archived' ? 'selected' : ''}>Archived</option>
                    </select>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Notes</span>
                    <textarea class="form-control notes-textarea" id="lead-notes">${escapeHtml(lead.notes || '')}</textarea>
                </div>
            </div>
        `;
        
        // Add footer with save button
        const footer = modal.querySelector('.modal-footer');
        if (footer) {
            footer.innerHTML = `
                <button class="btn btn-secondary" onclick="window.AdminApp.closeModal('detail-modal')">Close</button>
                <button class="btn btn-primary" onclick="window.AdminApp.saveLead('${lead.id}')">Save Changes</button>
            `;
        }
        
        openModal('detail-modal');
    }

    function saveLead(id) {
        const statusSelect = $('#lead-status-select');
        const notesTextarea = $('#lead-notes');
        
        if (statusSelect && notesTextarea) {
            DataStore.updateLead(id, {
                status: statusSelect.value,
                notes: notesTextarea.value
            });
            
            closeModal('detail-modal');
            renderLeadsTable();
            renderDashboard();
        }
    }

    // =========================================
    // PLAN REQUESTS TAB
    // =========================================
    function renderPlanRequestsTable() {
        const container = $('#plan-requests-table-body');
        const countEl = $('#plan-requests-count');
        if (!container) return;
        
        const requests = DataStore.listPlanRequests();
        const statusFilter = state.statusFilters.planRequests;
        let filtered = requests;
        
        if (statusFilter && statusFilter !== 'all') {
            filtered = filtered.filter(r => r.status === statusFilter);
        }
        
        filtered = filterData(filtered, state.searchFilters.planRequests, ['name', 'email', 'phone', 'plan']);
        
        if (countEl) {
            countEl.textContent = `${filtered.length} request${filtered.length !== 1 ? 's' : ''}`;
        }
        
        if (filtered.length === 0) {
            container.innerHTML = '<tr><td colspan="7" class="empty-state">No plan requests yet</td></tr>';
            return;
        }
        
        container.innerHTML = filtered.map(req => `
            <tr>
                <td>${formatDateTime(req.createdAt)}</td>
                <td>${escapeHtml(req.plan || '-')}</td>
                <td>${escapeHtml(req.name || '-')}</td>
                <td>
                    ${req.email ? `<a href="mailto:${escapeHtml(req.email)}">${escapeHtml(req.email)}</a>` : '-'}
                </td>
                <td>
                    ${req.phone ? `<a href="tel:${escapeHtml(req.phone)}">${escapeHtml(req.phone)}</a>` : '-'}
                </td>
                <td><span class="status-badge ${req.status || 'new'}">${req.status || 'new'}</span></td>
                <td>
                    <button class="action-btn" onclick="window.AdminApp.viewPlanRequest('${req.id}')">View</button>
                </td>
            </tr>
        `).join('');
        
        // Set up search and filter
        initTableSearch('plan-requests-search', 'planRequests');
        initPlanRequestsStatusFilter();
    }

    function initPlanRequestsStatusFilter() {
        const select = $('#plan-requests-status-filter');
        if (!select) return;
        
        select.removeEventListener('change', handlePlanRequestsStatusChange);
        select.addEventListener('change', handlePlanRequestsStatusChange);
    }

    function handlePlanRequestsStatusChange(e) {
        state.statusFilters.planRequests = e.target.value;
        renderPlanRequestsTable();
    }

    function viewPlanRequest(id) {
        const requests = DataStore.listPlanRequests();
        const req = requests.find(r => r.id === id);
        if (!req) return;
        
        const modal = $('#detail-modal');
        const title = $('#detail-modal-title');
        const body = $('#detail-modal-body');
        
        if (!modal || !body) return;
        
        title.textContent = 'Plan Request Details';
        
        body.innerHTML = `
            <div class="detail-grid">
                <div class="detail-row">
                    <span class="detail-label">Plan</span>
                    <span class="detail-value" style="font-weight: 600; color: var(--primary-color);">${escapeHtml(req.plan || '-')}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Name</span>
                    <span class="detail-value">${escapeHtml(req.name || '-')}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Email</span>
                    <span class="detail-value">
                        ${req.email ? `<a href="mailto:${escapeHtml(req.email)}">${escapeHtml(req.email)}</a>` : '-'}
                    </span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Phone</span>
                    <span class="detail-value">
                        ${req.phone ? `<a href="tel:${escapeHtml(req.phone)}">${escapeHtml(req.phone)}</a>` : '-'}
                    </span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Submitted</span>
                    <span class="detail-value">${formatDateTime(req.createdAt)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Additional Info</span>
                    <span class="detail-value">${escapeHtml(req.additionalInfo || '-')}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Status</span>
                    <select class="form-control status-select" id="plan-request-status-select">
                        <option value="new" ${req.status === 'new' ? 'selected' : ''}>New</option>
                        <option value="contacted" ${req.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                        <option value="booked" ${req.status === 'booked' ? 'selected' : ''}>Booked</option>
                        <option value="archived" ${req.status === 'archived' ? 'selected' : ''}>Archived</option>
                    </select>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Notes</span>
                    <textarea class="form-control notes-textarea" id="plan-request-notes">${escapeHtml(req.notes || '')}</textarea>
                </div>
            </div>
        `;
        
        // Add footer with save button
        const footer = modal.querySelector('.modal-footer');
        if (footer) {
            footer.innerHTML = `
                <button class="btn btn-secondary" onclick="window.AdminApp.closeModal('detail-modal')">Close</button>
                <button class="btn btn-primary" onclick="window.AdminApp.savePlanRequest('${req.id}')">Save Changes</button>
            `;
        }
        
        openModal('detail-modal');
    }

    function savePlanRequest(id) {
        const statusSelect = $('#plan-request-status-select');
        const notesTextarea = $('#plan-request-notes');
        
        if (statusSelect && notesTextarea) {
            DataStore.updatePlanRequest(id, {
                status: statusSelect.value,
                notes: notesTextarea.value
            });
            
            closeModal('detail-modal');
            renderPlanRequestsTable();
            renderDashboard();
        }
    }

    // =========================================
    // SETTINGS TAB
    // =========================================
    function renderSettings() {
        // Storage info
        const storageContainer = $('#storage-info');
        if (storageContainer && typeof DataStore !== 'undefined') {
            const visitors = DataStore.listVisitors().length;
            const events = DataStore.listEvents().length;
            const leads = DataStore.listLeads().length;
            const planRequests = DataStore.listPlanRequests().length;
            
            storageContainer.innerHTML = `
                <div class="storage-item">
                    <span>Visitors</span>
                    <strong>${visitors}</strong>
                </div>
                <div class="storage-item">
                    <span>Events</span>
                    <strong>${events}</strong>
                </div>
                <div class="storage-item">
                    <span>Leads</span>
                    <strong>${leads}</strong>
                </div>
                <div class="storage-item">
                    <span>Plan Requests</span>
                    <strong>${planRequests}</strong>
                </div>
            `;
        }
    }

    // =========================================
    // EXPORTS
    // =========================================
    function initExports() {
        // JSON exports
        $('#export-all-json')?.addEventListener('click', () => exportJSON('all'));
        $('#export-visitors-json')?.addEventListener('click', () => exportJSON('visitors'));
        $('#export-events-json')?.addEventListener('click', () => exportJSON('events'));
        $('#export-leads-json')?.addEventListener('click', () => exportJSON('leads'));
        $('#export-plans-json')?.addEventListener('click', () => exportJSON('planRequests'));
        
        // CSV exports
        $('#export-leads-csv')?.addEventListener('click', () => exportCSV('leads'));
        $('#export-plans-csv')?.addEventListener('click', () => exportCSV('planRequests'));
        $('#export-events-csv')?.addEventListener('click', () => exportCSV('events'));
    }

    function exportJSON(type) {
        let data, filename;
        
        switch (type) {
            case 'all':
                data = DataStore.exportAllData();
                filename = 'bossbooker-all-data.json';
                break;
            case 'visitors':
                data = DataStore.listVisitors();
                filename = 'bossbooker-visitors.json';
                break;
            case 'events':
                data = DataStore.listEvents();
                filename = 'bossbooker-events.json';
                break;
            case 'leads':
                data = DataStore.listLeads();
                filename = 'bossbooker-leads.json';
                break;
            case 'planRequests':
                data = DataStore.listPlanRequests();
                filename = 'bossbooker-plan-requests.json';
                break;
            default:
                return;
        }
        
        downloadFile(JSON.stringify(data, null, 2), filename, 'application/json');
    }

    function exportCSV(type) {
        let csv, filename;
        
        switch (type) {
            case 'leads':
                csv = DataStore.exportToCSV('leads');
                filename = 'bossbooker-leads.csv';
                break;
            case 'planRequests':
                csv = DataStore.exportToCSV('planRequests');
                filename = 'bossbooker-plan-requests.csv';
                break;
            case 'events':
                csv = DataStore.exportToCSV('events');
                filename = 'bossbooker-events.csv';
                break;
            default:
                return;
        }
        
        downloadFile(csv, filename, 'text/csv');
    }

    function downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // =========================================
    // DANGER ZONE
    // =========================================
    function initDangerZone() {
        $('#clear-all-data')?.addEventListener('click', () => {
            showConfirmModal(
                'Clear All Data',
                'Are you sure you want to delete ALL data? This cannot be undone.',
                () => {
                    DataStore.clearAllData();
                    refreshData();
                    closeModal('confirm-modal');
                }
            );
        });
    }

    // =========================================
    // MODALS
    // =========================================
    function initModals() {
        // Close buttons
        $$('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal-overlay');
                if (modal) {
                    modal.classList.remove('active');
                }
            });
        });
        
        // Click outside to close
        $$('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    function openModal(id) {
        const modal = $(`#${id}`);
        if (modal) {
            modal.classList.add('active');
        }
    }

    function closeModal(id) {
        const modal = $(`#${id}`);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    function showConfirmModal(title, message, onConfirm) {
        const modal = $('#confirm-modal');
        const titleEl = $('#confirm-modal-title');
        const messageEl = $('#confirm-modal-message');
        const confirmBtn = $('#confirm-modal-confirm');
        
        if (!modal) return;
        
        if (titleEl) titleEl.textContent = title;
        if (messageEl) messageEl.textContent = message;
        
        if (confirmBtn) {
            // Remove old listeners
            const newBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
            newBtn.addEventListener('click', onConfirm);
        }
        
        openModal('confirm-modal');
    }

    // =========================================
    // TABLE HELPERS
    // =========================================
    function initTableSearch(inputId, dataType) {
        const input = $(`#${inputId}`);
        if (!input) return;
        
        // Remove old listener
        input.removeEventListener('input', handleSearchInput);
        input.dataset.dataType = dataType;
        input.addEventListener('input', handleSearchInput);
    }

    function handleSearchInput(e) {
        const dataType = e.target.dataset.dataType;
        state.searchFilters[dataType] = e.target.value;
        refreshTabData(state.currentTab);
    }

    function filterData(data, searchTerm, fields) {
        if (!searchTerm) return data;
        
        const term = searchTerm.toLowerCase();
        return data.filter(item => {
            return fields.some(field => {
                const value = item[field];
                if (typeof value === 'string') {
                    return value.toLowerCase().includes(term);
                }
                if (typeof value === 'object') {
                    return JSON.stringify(value).toLowerCase().includes(term);
                }
                return false;
            });
        });
    }

    // =========================================
    // UTILITY FUNCTIONS
    // =========================================
    function formatNumber(num) {
        if (typeof num !== 'number') return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    function formatDate(timestamp) {
        if (!timestamp) return '-';
        return new Date(timestamp).toLocaleDateString();
    }

    function formatDateTime(timestamp) {
        if (!timestamp) return '-';
        const d = new Date(timestamp);
        return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    function formatRelativeTime(timestamp) {
        if (!timestamp) return '';
        
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }

    function formatEventText(event) {
        const type = event.eventType || 'event';
        const page = event.page || '';
        
        switch (type) {
            case 'page_view':
                return `Page view: ${page}`;
            case 'click':
                return `Click: ${event.data?.element || 'element'}`;
            case 'cta_click':
                return `CTA click: ${event.data?.cta || 'button'}`;
            case 'lead_submit':
                return `Lead submitted: ${event.data?.email || 'contact form'}`;
            case 'plan_request':
                return `Plan requested: ${event.data?.plan || 'unknown'}`;
            case 'quiz_start':
                return 'Quiz started';
            case 'quiz_complete':
                return 'Quiz completed';
            default:
                return `${type} on ${page}`;
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // =========================================
    // EXPOSE PUBLIC API
    // =========================================
    window.AdminApp = {
        viewLead,
        saveLead,
        viewPlanRequest,
        savePlanRequest,
        closeModal,
        refreshData
    };

})();
