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
        currentTab: 'dashboard'
    };

    // =========================================
    // DOM HELPERS
    // =========================================
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // =========================================
    // INITIALIZATION
    // =========================================
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        // Always attach form handler first to prevent default submission
        const loginForm = $('#loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
        
        if (isLockedOut()) {
            showLockoutError();
            return;
        }

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

        const passwordInput = $('#password');
        const password = passwordInput.value.trim().toLowerCase();
        const errorEl = $('#loginError');

        if (password === CONFIG.PASSWORD.toLowerCase()) {
            sessionStorage.setItem(CONFIG.SESSION_KEY, 'true');
            clearLoginAttempts();
            showDashboard();
        } else {
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
        
        const errorEl = $('#loginError');
        if (errorEl) {
            errorEl.textContent = `Too many failed attempts. Try again in ${remaining} minute${remaining !== 1 ? 's' : ''}.`;
            errorEl.style.display = 'block';
        }
        
        const passwordInput = $('#password');
        const loginBtn = $('#loginForm button[type="submit"]');
        if (passwordInput) passwordInput.disabled = true;
        if (loginBtn) loginBtn.disabled = true;
    }

    // =========================================
    // VIEW SWITCHING
    // =========================================
    function showLoginScreen() {
        const loginScreen = $('#loginScreen');
        const dashboard = $('#adminDashboard');
        
        if (loginScreen) loginScreen.style.display = 'flex';
        if (dashboard) dashboard.style.display = 'none';
    }

    function showDashboard() {
        const loginScreen = $('#loginScreen');
        const dashboard = $('#adminDashboard');
        
        if (loginScreen) loginScreen.style.display = 'none';
        if (dashboard) dashboard.style.display = 'flex';
        
        initDashboard();
    }

    // =========================================
    // DASHBOARD INITIALIZATION
    // =========================================
    function initDashboard() {
        // Navigation
        $$('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                if (tab) switchTab(tab);
            });
        });
        
        // Logout
        const logoutBtn = $('#logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
        
        // Refresh
        const refreshBtn = $('#refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', refreshData);
        }
        
        // Search inputs
        $('#visitorSearch')?.addEventListener('input', renderVisitors);
        $('#eventSearch')?.addEventListener('input', renderEvents);
        $('#eventTypeFilter')?.addEventListener('change', renderEvents);
        $('#leadSearch')?.addEventListener('input', renderLeads);
        $('#leadStatusFilter')?.addEventListener('change', renderLeads);
        $('#requestSearch')?.addEventListener('input', renderRequests);
        $('#requestStatusFilter')?.addEventListener('change', renderRequests);
        
        // Initial data load
        refreshData();
        switchTab('dashboard');
    }

    function switchTab(tabName) {
        state.currentTab = tabName;
        
        // Update nav items
        $$('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tabName);
        });
        
        // Update tab content
        $$('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}Tab`);
        });
        
        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            visitors: 'Visitors',
            events: 'Events',
            leads: 'Leads',
            requests: 'Plan Requests',
            exports: 'Export Data',
            pricing: 'Pricing & Plans',
            settings: 'Settings'
        };
        const pageTitle = $('#pageTitle');
        if (pageTitle) {
            pageTitle.textContent = titles[tabName] || 'Dashboard';
        }
        
        refreshData();
    }

    function refreshData() {
        updateLastUpdated();
        
        switch (state.currentTab) {
            case 'dashboard':
                renderDashboard();
                break;
            case 'visitors':
                renderVisitors();
                break;
            case 'events':
                renderEvents();
                break;
            case 'leads':
                renderLeads();
                break;
            case 'requests':
                renderRequests();
                break;
            case 'pricing':
                if (typeof PricingAdmin !== 'undefined') {
                    PricingAdmin.render();
                }
                break;
            case 'settings':
                renderSettings();
                break;
        }
        
        updateBadges();
    }

    function updateLastUpdated() {
        const el = $('#lastUpdated');
        if (el) {
            el.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
        }
    }

    function updateBadges() {
        if (typeof DataStore === 'undefined') return;
        
        const leadsNew = DataStore.listLeads().filter(l => l.status === 'new').length;
        const requestsNew = DataStore.listPlanRequests().filter(r => r.status === 'new').length;
        
        const leadsBadge = $('#leadsBadge');
        const requestsBadge = $('#requestsBadge');
        
        if (leadsBadge) {
            leadsBadge.textContent = leadsNew;
            leadsBadge.style.display = leadsNew > 0 ? 'inline' : 'none';
        }
        
        if (requestsBadge) {
            requestsBadge.textContent = requestsNew;
            requestsBadge.style.display = requestsNew > 0 ? 'inline' : 'none';
        }
    }

    // =========================================
    // DASHBOARD TAB
    // =========================================
    function renderDashboard() {
        if (typeof DataStore === 'undefined') return;
        
        const stats = DataStore.getDashboardStats();
        
        // Stat cards
        setEl('#statVisitors', formatNum(stats.uniqueVisitors));
        setEl('#statSessions', formatNum(stats.totalSessions));
        setEl('#statPageviews', formatNum(stats.totalPageViews));
        setEl('#statConversions', formatNum(stats.totalLeads + stats.totalPlanRequests));
        
        // Top pages chart
        renderBarChart('#topPagesChart', stats.topPages, 'page', 'views');
        
        // Top clicks (from events)
        const events = DataStore.listEvents();
        const clickEvents = events.filter(e => e.eventType === 'click' || e.eventType === 'cta_click');
        const clickCounts = {};
        clickEvents.forEach(e => {
            const label = e.data?.element || e.data?.cta || e.data?.label || 'Unknown';
            clickCounts[label] = (clickCounts[label] || 0) + 1;
        });
        const topClicks = Object.entries(clickCounts)
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        renderBarChart('#topClicksChart', topClicks, 'label', 'count');
        
        // Conversion stats
        const conversionEl = $('#conversionStats');
        if (conversionEl) {
            conversionEl.innerHTML = `
                <div class="conversion-item"><span>Contact Leads</span><span>${stats.totalLeads}</span></div>
                <div class="conversion-item"><span>Plan Requests</span><span>${stats.totalPlanRequests}</span></div>
                <div class="conversion-item"><span>Quiz Completions</span><span>${stats.quizCompletions || 0}</span></div>
            `;
        }
        
        // Recent activity
        const activityEl = $('#recentActivity');
        if (activityEl) {
            const recentEvents = events.slice(0, 15);
            if (recentEvents.length === 0) {
                activityEl.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">No activity yet</p>';
            } else {
                activityEl.innerHTML = recentEvents.map(e => `
                    <div class="activity-item">
                        <span class="activity-dot ${e.eventType || 'default'}"></span>
                        <span class="activity-text">${formatEventText(e)}</span>
                        <span class="activity-time">${formatRelativeTime(e.timestamp)}</span>
                    </div>
                `).join('');
            }
        }
    }

    function renderBarChart(selector, data, labelKey, valueKey) {
        const container = $(selector);
        if (!container) return;
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">No data yet</p>';
            return;
        }
        
        const maxVal = Math.max(...data.map(d => d[valueKey] || 0));
        
        container.innerHTML = data.slice(0, 5).map(item => {
            const label = item[labelKey] || 'Unknown';
            const value = item[valueKey] || 0;
            const pct = maxVal > 0 ? (value / maxVal * 100).toFixed(1) : 0;
            return `
                <div class="bar-item">
                    <span class="bar-label" title="${escHtml(label)}">${escHtml(label)}</span>
                    <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
                    <span class="bar-value">${formatNum(value)}</span>
                </div>
            `;
        }).join('');
    }

    // =========================================
    // VISITORS TAB
    // =========================================
    function renderVisitors() {
        if (typeof DataStore === 'undefined') return;
        
        const searchTerm = ($('#visitorSearch')?.value || '').toLowerCase();
        let visitors = DataStore.listVisitors();
        
        if (searchTerm) {
            visitors = visitors.filter(v => 
                (v.visitorId || '').toLowerCase().includes(searchTerm) ||
                (v.referrer || '').toLowerCase().includes(searchTerm) ||
                (v.userAgent || '').toLowerCase().includes(searchTerm)
            );
        }
        
        setEl('#visitorCount', `${visitors.length} visitor${visitors.length !== 1 ? 's' : ''}`);
        
        const tbody = $('#visitorsBody');
        if (!tbody) return;
        
        if (visitors.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:40px;">No visitors yet</td></tr>';
            return;
        }
        
        tbody.innerHTML = visitors.map(v => `
            <tr>
                <td><code style="font-size:11px;">${(v.visitorId || '').substring(0, 12)}...</code></td>
                <td>${formatDate(v.firstSeen)}</td>
                <td>${formatDate(v.lastSeen)}</td>
                <td>${v.pageViews || 0}</td>
                <td title="${escHtml(v.userAgent || '')}">${getDeviceType(v.userAgent)}</td>
                <td title="${escHtml(v.referrer || '')}">${truncate(v.referrer || 'Direct', 20)}</td>
                <td><button class="action-btn" onclick="viewVisitor('${v.visitorId}')">View</button></td>
            </tr>
        `).join('');
    }

    // =========================================
    // EVENTS TAB
    // =========================================
    function renderEvents() {
        if (typeof DataStore === 'undefined') return;
        
        const searchTerm = ($('#eventSearch')?.value || '').toLowerCase();
        const typeFilter = $('#eventTypeFilter')?.value || '';
        let events = DataStore.listEvents();
        
        if (typeFilter) {
            events = events.filter(e => e.eventType === typeFilter);
        }
        
        if (searchTerm) {
            events = events.filter(e => 
                (e.eventType || '').toLowerCase().includes(searchTerm) ||
                (e.page || '').toLowerCase().includes(searchTerm) ||
                JSON.stringify(e.data || {}).toLowerCase().includes(searchTerm)
            );
        }
        
        setEl('#eventCount', `${events.length} event${events.length !== 1 ? 's' : ''}`);
        
        const tbody = $('#eventsBody');
        if (!tbody) return;
        
        if (events.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:40px;">No events yet</td></tr>';
            return;
        }
        
        tbody.innerHTML = events.slice(0, 100).map(e => {
            const label = e.data?.element || e.data?.cta || e.data?.label || e.data?.formName || '-';
            return `
                <tr>
                    <td>${formatDateTime(e.timestamp)}</td>
                    <td><span class="event-type ${e.eventType || ''}">${e.eventType || 'unknown'}</span></td>
                    <td title="${escHtml(label)}">${truncate(label, 30)}</td>
                    <td>${e.page || '-'}</td>
                    <td><code style="font-size:10px;">${(e.visitorId || '').substring(0, 8)}...</code></td>
                </tr>
            `;
        }).join('');
    }

    // =========================================
    // LEADS TAB
    // =========================================
    function renderLeads() {
        if (typeof DataStore === 'undefined') return;
        
        const searchTerm = ($('#leadSearch')?.value || '').toLowerCase();
        const statusFilter = $('#leadStatusFilter')?.value || '';
        let leads = DataStore.listLeads();
        
        if (statusFilter) {
            leads = leads.filter(l => l.status === statusFilter);
        }
        
        if (searchTerm) {
            leads = leads.filter(l => 
                (l.name || '').toLowerCase().includes(searchTerm) ||
                (l.email || '').toLowerCase().includes(searchTerm) ||
                (l.phone || '').toLowerCase().includes(searchTerm) ||
                (l.company || '').toLowerCase().includes(searchTerm)
            );
        }
        
        setEl('#leadCount', `${leads.length} lead${leads.length !== 1 ? 's' : ''}`);
        
        const tbody = $('#leadsBody');
        if (!tbody) return;
        
        if (leads.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:40px;">No leads yet</td></tr>';
            return;
        }
        
        tbody.innerHTML = leads.map(l => `
            <tr>
                <td><span class="status-badge ${l.status || 'new'}">${l.status || 'new'}</span></td>
                <td>${formatDateTime(l.createdAt)}</td>
                <td>${escHtml(l.name || '-')}</td>
                <td>${l.email ? `<a href="mailto:${escHtml(l.email)}">${escHtml(l.email)}</a>` : '-'}</td>
                <td>${l.phone ? `<a href="tel:${escHtml(l.phone)}">${escHtml(l.phone)}</a>` : '-'}</td>
                <td>${escHtml(l.company || '-')}</td>
                <td><button class="action-btn" onclick="viewLead('${l.id}')">View</button></td>
            </tr>
        `).join('');
    }

    // =========================================
    // REQUESTS TAB
    // =========================================
    function renderRequests() {
        if (typeof DataStore === 'undefined') return;
        
        const searchTerm = ($('#requestSearch')?.value || '').toLowerCase();
        const statusFilter = $('#requestStatusFilter')?.value || '';
        let requests = DataStore.listPlanRequests();
        
        if (statusFilter) {
            requests = requests.filter(r => r.status === statusFilter);
        }
        
        if (searchTerm) {
            requests = requests.filter(r => 
                (r.name || '').toLowerCase().includes(searchTerm) ||
                (r.email || '').toLowerCase().includes(searchTerm) ||
                (r.plan || '').toLowerCase().includes(searchTerm)
            );
        }
        
        setEl('#requestCount', `${requests.length} request${requests.length !== 1 ? 's' : ''}`);
        
        const tbody = $('#requestsBody');
        if (!tbody) return;
        
        if (requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:40px;">No requests yet</td></tr>';
            return;
        }
        
        tbody.innerHTML = requests.map(r => `
            <tr>
                <td><span class="status-badge ${r.status || 'new'}">${r.status || 'new'}</span></td>
                <td>${formatDateTime(r.createdAt)}</td>
                <td>${escHtml(r.name || '-')}</td>
                <td>${r.email ? `<a href="mailto:${escHtml(r.email)}">${escHtml(r.email)}</a>` : '-'}</td>
                <td>${escHtml(r.plan || '-')}</td>
                <td>${escHtml(r.monthlyTotal || '-')}</td>
                <td><button class="action-btn" onclick="viewRequest('${r.id}')">View</button></td>
            </tr>
        `).join('');
    }

    // =========================================
    // SETTINGS TAB
    // =========================================
    function renderSettings() {
        if (typeof DataStore === 'undefined') return;
        
        const visitors = DataStore.listVisitors().length;
        const events = DataStore.listEvents().length;
        const leads = DataStore.listLeads().length;
        const requests = DataStore.listPlanRequests().length;
        
        setEl('#storageVisitors', visitors);
        setEl('#storageEvents', events);
        setEl('#storageLeads', leads);
        setEl('#storageRequests', requests);
        
        // Calculate approximate storage size
        let totalSize = 0;
        ['bb_visitors', 'bb_events', 'bb_leads', 'bb_plan_requests'].forEach(key => {
            const data = localStorage.getItem(key);
            if (data) totalSize += data.length * 2; // UTF-16 = 2 bytes per char
        });
        setEl('#storageSize', `${(totalSize / 1024).toFixed(1)} KB`);
    }

    // =========================================
    // MODALS
    // =========================================
    window.viewVisitor = function(visitorId) {
        const visitors = DataStore.listVisitors();
        const v = visitors.find(x => x.visitorId === visitorId);
        if (!v) return;
        
        const events = DataStore.listEvents().filter(e => e.visitorId === visitorId).slice(0, 20);
        
        showModal('Visitor Details', `
            <div class="detail-grid">
                <div class="detail-row"><span class="detail-label">Visitor ID</span><span class="detail-value"><code>${v.visitorId}</code></span></div>
                <div class="detail-row"><span class="detail-label">First Seen</span><span class="detail-value">${formatDateTime(v.firstSeen)}</span></div>
                <div class="detail-row"><span class="detail-label">Last Seen</span><span class="detail-value">${formatDateTime(v.lastSeen)}</span></div>
                <div class="detail-row"><span class="detail-label">Page Views</span><span class="detail-value">${v.pageViews || 0}</span></div>
                <div class="detail-row"><span class="detail-label">Referrer</span><span class="detail-value">${escHtml(v.referrer || 'Direct')}</span></div>
                <div class="detail-row"><span class="detail-label">User Agent</span><span class="detail-value" style="font-size:12px;word-break:break-all;">${escHtml(v.userAgent || '-')}</span></div>
                <div class="detail-row"><span class="detail-label">Recent Events</span></div>
            </div>
            <div class="timeline" style="margin-top:10px;">
                ${events.length === 0 ? '<p style="color:var(--text-muted);">No events</p>' : events.map(e => `
                    <div class="timeline-item">
                        <span class="timeline-time">${formatRelativeTime(e.timestamp)}</span>
                        <span class="timeline-content">${formatEventText(e)}</span>
                    </div>
                `).join('')}
            </div>
        `);
    };

    window.viewLead = function(id) {
        const leads = DataStore.listLeads();
        const l = leads.find(x => x.id === id);
        if (!l) return;
        
        showModal('Lead Details', `
            <div class="detail-grid">
                <div class="detail-row"><span class="detail-label">Name</span><span class="detail-value">${escHtml(l.name || '-')}</span></div>
                <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${l.email ? `<a href="mailto:${escHtml(l.email)}">${escHtml(l.email)}</a>` : '-'}</span></div>
                <div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value">${l.phone ? `<a href="tel:${escHtml(l.phone)}">${escHtml(l.phone)}</a>` : '-'}</span></div>
                <div class="detail-row"><span class="detail-label">Company</span><span class="detail-value">${escHtml(l.company || '-')}</span></div>
                <div class="detail-row"><span class="detail-label">Source</span><span class="detail-value">${escHtml(l.source || '-')}</span></div>
                <div class="detail-row"><span class="detail-label">Created</span><span class="detail-value">${formatDateTime(l.createdAt)}</span></div>
                <div class="detail-row"><span class="detail-label">Message</span><span class="detail-value">${escHtml(l.message || '-')}</span></div>
                <div class="detail-row">
                    <span class="detail-label">Status</span>
                    <select class="form-control" id="leadStatusEdit" style="max-width:200px;">
                        <option value="new" ${l.status === 'new' ? 'selected' : ''}>New</option>
                        <option value="contacted" ${l.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                        <option value="booked" ${l.status === 'booked' ? 'selected' : ''}>Booked</option>
                        <option value="archived" ${l.status === 'archived' ? 'selected' : ''}>Archived</option>
                    </select>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Notes</span>
                    <textarea class="form-control" id="leadNotesEdit" rows="3" style="width:100%;">${escHtml(l.notes || '')}</textarea>
                </div>
            </div>
        `, `
            <button class="btn-secondary" onclick="closeModal()">Close</button>
            <button class="btn-primary" onclick="saveLead('${l.id}')">Save Changes</button>
        `);
    };

    window.saveLead = function(id) {
        const status = $('#leadStatusEdit')?.value;
        const notes = $('#leadNotesEdit')?.value;
        
        DataStore.updateLead(id, { status, notes });
        closeModal();
        refreshData();
    };

    window.viewRequest = function(id) {
        const requests = DataStore.listPlanRequests();
        const r = requests.find(x => x.id === id);
        if (!r) return;
        
        showModal('Plan Request Details', `
            <div class="detail-grid">
                <div class="detail-row"><span class="detail-label">Plan</span><span class="detail-value" style="color:var(--primary-color);font-weight:600;">${escHtml(r.plan || '-')}</span></div>
                <div class="detail-row"><span class="detail-label">Monthly</span><span class="detail-value">${escHtml(r.monthlyTotal || '-')}</span></div>
                <div class="detail-row"><span class="detail-label">Setup Fee</span><span class="detail-value">${escHtml(r.setupFee || '-')}</span></div>
                <div class="detail-row"><span class="detail-label">Name</span><span class="detail-value">${escHtml(r.name || '-')}</span></div>
                <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${r.email ? `<a href="mailto:${escHtml(r.email)}">${escHtml(r.email)}</a>` : '-'}</span></div>
                <div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value">${r.phone ? `<a href="tel:${escHtml(r.phone)}">${escHtml(r.phone)}</a>` : '-'}</span></div>
                <div class="detail-row"><span class="detail-label">Company</span><span class="detail-value">${escHtml(r.company || '-')}</span></div>
                <div class="detail-row"><span class="detail-label">Created</span><span class="detail-value">${formatDateTime(r.createdAt)}</span></div>
                <div class="detail-row"><span class="detail-label">Additional Info</span><span class="detail-value">${escHtml(r.additionalInfo || '-')}</span></div>
                <div class="detail-row">
                    <span class="detail-label">Status</span>
                    <select class="form-control" id="requestStatusEdit" style="max-width:200px;">
                        <option value="new" ${r.status === 'new' ? 'selected' : ''}>New</option>
                        <option value="contacted" ${r.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                        <option value="booked" ${r.status === 'booked' ? 'selected' : ''}>Booked</option>
                        <option value="archived" ${r.status === 'archived' ? 'selected' : ''}>Archived</option>
                    </select>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Notes</span>
                    <textarea class="form-control" id="requestNotesEdit" rows="3" style="width:100%;">${escHtml(r.notes || '')}</textarea>
                </div>
            </div>
        `, `
            <button class="btn-secondary" onclick="closeModal()">Close</button>
            <button class="btn-primary" onclick="saveRequest('${r.id}')">Save Changes</button>
        `);
    };

    window.saveRequest = function(id) {
        const status = $('#requestStatusEdit')?.value;
        const notes = $('#requestNotesEdit')?.value;
        
        DataStore.updatePlanRequest(id, { status, notes });
        closeModal();
        refreshData();
    };

    function showModal(title, content, footer = '') {
        const modal = $('#detailModal');
        if (!modal) return;
        
        setEl('#modalTitle', title);
        $('#modalContent').innerHTML = content;
        $('#modalFooter').innerHTML = footer || '<button class="btn-secondary" onclick="closeModal()">Close</button>';
        
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
    }

    window.closeModal = function() {
        const modal = $('#detailModal');
        if (modal) {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
        }
    };

    // =========================================
    // EXPORTS
    // =========================================
    window.exportData = function(type, format) {
        if (typeof DataStore === 'undefined') return;
        
        let data, filename;
        
        switch (type) {
            case 'leads':
                data = DataStore.listLeads();
                filename = 'bossbooker-leads';
                break;
            case 'plan_requests':
                data = DataStore.listPlanRequests();
                filename = 'bossbooker-plan-requests';
                break;
            case 'events':
                data = DataStore.listEvents();
                filename = 'bossbooker-events';
                break;
            case 'visitors':
                data = DataStore.listVisitors();
                filename = 'bossbooker-visitors';
                break;
            default:
                return;
        }
        
        if (format === 'csv') {
            const csv = DataStore.exportToCSV(type === 'plan_requests' ? 'planRequests' : type);
            downloadFile(csv, `${filename}.csv`, 'text/csv');
        } else {
            downloadFile(JSON.stringify(data, null, 2), `${filename}.json`, 'application/json');
        }
    };

    window.exportAllData = function() {
        if (typeof DataStore === 'undefined') return;
        const data = DataStore.exportAllData();
        downloadFile(JSON.stringify(data, null, 2), 'bossbooker-all-data.json', 'application/json');
    };

    window.confirmClearData = function() {
        const modal = $('#confirmModal');
        if (!modal) return;
        
        setEl('#confirmTitle', 'Clear All Data');
        $('#confirmContent').innerHTML = '<p style="color:var(--error-color);">Are you sure you want to permanently delete ALL data? This cannot be undone.</p>';
        
        const confirmBtn = $('#confirmAction');
        if (confirmBtn) {
            confirmBtn.onclick = function() {
                DataStore.clearAllData();
                closeConfirmModal();
                refreshData();
                alert('All data has been cleared.');
            };
        }
        
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
    };

    window.closeConfirmModal = function() {
        const modal = $('#confirmModal');
        if (modal) {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
        }
    };

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
    // UTILITY FUNCTIONS
    // =========================================
    function setEl(selector, value) {
        const el = $(selector);
        if (el) el.textContent = value;
    }

    function formatNum(n) {
        if (typeof n !== 'number') return '0';
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return n.toString();
    }

    function formatDate(ts) {
        if (!ts) return '-';
        return new Date(ts).toLocaleDateString();
    }

    function formatDateTime(ts) {
        if (!ts) return '-';
        const d = new Date(ts);
        return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    function formatRelativeTime(ts) {
        if (!ts) return '';
        const diff = Date.now() - ts;
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(mins / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (mins > 0) return `${mins}m ago`;
        return 'Just now';
    }

    function formatEventText(e) {
        const type = e.eventType || 'event';
        switch (type) {
            case 'page_view': return `Viewed ${e.page || 'page'}`;
            case 'click': return `Clicked ${e.data?.element || 'element'}`;
            case 'cta_click': return `CTA: ${e.data?.cta || 'button'}`;
            case 'nav_click': return `Nav: ${e.data?.page || 'link'}`;
            case 'lead_submit': return `Lead submitted`;
            case 'plan_request': return `Plan requested: ${e.data?.plan || ''}`;
            case 'quiz_start': return 'Quiz started';
            case 'quiz_complete': return 'Quiz completed';
            case 'form_submit': return `Form: ${e.data?.formName || 'submitted'}`;
            default: return `${type}`;
        }
    }

    function getDeviceType(ua) {
        if (!ua) return 'Unknown';
        ua = ua.toLowerCase();
        if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'Mobile';
        if (ua.includes('tablet') || ua.includes('ipad')) return 'Tablet';
        return 'Desktop';
    }

    function truncate(str, len) {
        if (!str) return '';
        return str.length > len ? str.substring(0, len) + '...' : str;
    }

    function escHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // =========================================
    // DEMO DATA GENERATOR
    // =========================================
    window.generateDemoData = function() {
        if (typeof DataStore === 'undefined') {
            alert('DataStore not loaded');
            return;
        }
        
        const now = Date.now();
        const DAY = 24 * 60 * 60 * 1000;
        
        // Sample data arrays
        const firstNames = ['James', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'Chris', 'Amanda', 'Ryan', 'Ashley', 'Brandon', 'Nicole', 'Justin', 'Stephanie', 'Kevin'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore'];
        const companies = ['Phoenix Auto Detailing', 'Mesa Car Care', 'Scottsdale Mobile Wash', 'Tempe Auto Spa', 'Gilbert Clean Cars', 'Chandler Detailers', 'Glendale Auto Pro', 'Peoria Car Works', 'Surprise Detail Co', 'Avondale Auto'];
        const pages = ['/', '/plans.html', '/contact.html', '/about.html', '/faq.html'];
        const referrers = ['https://google.com', 'https://facebook.com', 'https://instagram.com', 'https://yelp.com', 'Direct', 'Direct', 'Direct'];
        const userAgents = [
            'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
            'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/119.0',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Safari/605.1',
            'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
        ];
        const plans = ['Starter', 'Growth', 'Pro', 'Enterprise'];
        const ctaButtons = ['Get Started', 'View Plans', 'Contact Us', 'Learn More', 'Schedule Demo'];
        
        function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
        function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
        function generateId() { return 'demo_' + Math.random().toString(36).substr(2, 12); }
        
        // Generate visitors
        const visitorCount = randomInt(15, 25);
        const visitors = [];
        for (let i = 0; i < visitorCount; i++) {
            const visitorId = generateId();
            const daysAgo = randomInt(0, 14);
            const firstSeen = now - (daysAgo * DAY) - randomInt(0, DAY);
            const lastSeen = firstSeen + randomInt(0, Math.min(daysAgo * DAY, 3 * DAY));
            
            const visitor = {
                visitorId,
                firstSeen,
                lastSeen,
                pageViews: randomInt(1, 12),
                referrer: randomFrom(referrers),
                userAgent: randomFrom(userAgents)
            };
            visitors.push(visitor);
            DataStore.saveVisitor(visitor);
        }
        
        // Generate events
        const eventCount = randomInt(80, 150);
        for (let i = 0; i < eventCount; i++) {
            const visitor = randomFrom(visitors);
            const daysAgo = randomInt(0, 14);
            const timestamp = now - (daysAgo * DAY) - randomInt(0, DAY);
            const page = randomFrom(pages);
            
            const eventTypes = ['page_view', 'page_view', 'page_view', 'click', 'cta_click', 'nav_click'];
            const eventType = randomFrom(eventTypes);
            
            let data = {};
            if (eventType === 'click') data = { element: randomFrom(['hero-btn', 'nav-link', 'footer-link', 'social-icon']) };
            if (eventType === 'cta_click') data = { cta: randomFrom(ctaButtons) };
            if (eventType === 'nav_click') data = { page: randomFrom(pages) };
            
            DataStore.logEvent({
                eventType,
                page,
                timestamp,
                visitorId: visitor.visitorId,
                sessionId: 'session_' + generateId(),
                data
            });
        }
        
        // Generate leads
        const leadCount = randomInt(5, 12);
        for (let i = 0; i < leadCount; i++) {
            const firstName = randomFrom(firstNames);
            const lastName = randomFrom(lastNames);
            const daysAgo = randomInt(0, 10);
            
            DataStore.saveLead({
                name: `${firstName} ${lastName}`,
                email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
                phone: `(602) ${randomInt(200, 999)}-${randomInt(1000, 9999)}`,
                company: randomFrom(companies),
                message: 'I would like more information about your booking services.',
                source: 'contact_form',
                status: randomFrom(['new', 'new', 'new', 'contacted', 'booked']),
                createdAt: now - (daysAgo * DAY) - randomInt(0, DAY)
            });
        }
        
        // Generate plan requests
        const requestCount = randomInt(3, 8);
        for (let i = 0; i < requestCount; i++) {
            const firstName = randomFrom(firstNames);
            const lastName = randomFrom(lastNames);
            const plan = randomFrom(plans);
            const daysAgo = randomInt(0, 10);
            
            const pricing = { Starter: '$99', Growth: '$199', Pro: '$349', Enterprise: '$499+' };
            const setup = { Starter: '$149', Growth: '$249', Pro: '$399', Enterprise: 'Custom' };
            
            DataStore.savePlanRequest({
                plan,
                monthlyTotal: pricing[plan],
                setupFee: setup[plan],
                name: `${firstName} ${lastName}`,
                email: `${firstName.toLowerCase()}@${randomFrom(['gmail.com', 'yahoo.com', 'outlook.com'])}`,
                phone: `(480) ${randomInt(200, 999)}-${randomInt(1000, 9999)}`,
                company: randomFrom(companies),
                additionalInfo: 'Looking forward to getting started!',
                status: randomFrom(['new', 'new', 'contacted']),
                createdAt: now - (daysAgo * DAY) - randomInt(0, DAY)
            });
        }
        
        alert(`Demo data generated!\n\n• ${visitorCount} visitors\n• ${eventCount} events\n• ${leadCount} leads\n• ${requestCount} plan requests`);
        refreshData();
    };

})();
