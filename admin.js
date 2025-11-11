// Boss Booker Admin Portal
// Supports both Cloudflare Workers KV (primary) and localStorage (fallback)

const STORAGE_KEYS = {
    CONTACTS: 'bossbooker_contacts',
    REQUESTS: 'bossbooker_requests',
    CLIENTS: 'bossbooker_clients',
    AUTH: 'bossbooker_admin_auth',
    TOKEN: 'bossbooker_admin_token'
};

// API helper - works with both Worker API and localStorage
const API = {
    // Check if using Worker API or localStorage
    useWorkerAPI() {
        return window.API_CONFIG && 
               !window.API_CONFIG.USE_LOCALSTORAGE_FALLBACK && 
               window.API_CONFIG.WORKER_URL !== 'https://bossbooker-api.YOUR-SUBDOMAIN.workers.dev';
    },

    // Get auth token
    getToken() {
        return localStorage.getItem(STORAGE_KEYS.TOKEN);
    },

    // Make authenticated API request
    async request(endpoint, options = {}) {
        if (!this.useWorkerAPI()) {
            throw new Error('Worker API not configured');
        }

        const token = this.getToken();
        const url = `${window.API_CONFIG.WORKER_URL}${endpoint}`;
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || error.message || 'API request failed');
        }

        return await response.json();
    }
};

// Initialize data storage (localStorage fallback)
function initStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.CONTACTS)) {
        localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.REQUESTS)) {
        localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
        localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify([]));
    }
}

// Get data from localStorage
function getDataLocal(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) {
        console.error('Error reading local data:', e);
        return [];
    }
}

// Save data to localStorage
function saveDataLocal(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error('Error saving local data:', e);
        return false;
    }
}

// Authentication
function checkAuth() {
    if (API.useWorkerAPI()) {
        return !!API.getToken();
    } else {
        // localStorage fallback
        const authData = localStorage.getItem(STORAGE_KEYS.AUTH);
        return authData === 'authenticated';
    }
}

async function login(password) {
    if (API.useWorkerAPI()) {
        try {
            const result = await API.request(window.API_CONFIG.ENDPOINTS.ADMIN_AUTH, {
                method: 'POST',
                body: JSON.stringify({ password })
            });

            if (result.success && result.token) {
                localStorage.setItem(STORAGE_KEYS.TOKEN, result.token);
                return { success: true };
            }
            return { success: false, message: 'Invalid password' };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: error.message || 'Authentication failed' };
        }
    } else {
        // localStorage fallback
        const adminUser = localStorage.getItem('ADMIN_USER');
        
        if (!adminUser) {
            return {
                success: false,
                message: 'Admin credentials not configured. Please set ADMIN_USER in localStorage (format: "username:password") or configure Cloudflare Worker API.'
            };
        }

        const [storedUsername, storedPassword] = adminUser.split(':');
        
        if (password === storedPassword) {
            localStorage.setItem(STORAGE_KEYS.AUTH, 'authenticated');
            return { success: true };
        }
        
        return { success: false, message: 'Invalid password' };
    }
}

function logout() {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    window.location.reload();
}

// Format date
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

// Render contact submissions
async function renderContacts() {
    const container = document.getElementById('contactsList');
    
    try {
        let contacts;
        if (API.useWorkerAPI()) {
            contacts = await API.request(window.API_CONFIG.ENDPOINTS.ADMIN_CONTACTS);
        } else {
            contacts = getDataLocal(STORAGE_KEYS.CONTACTS);
        }
        
        if (contacts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <p class="empty-state-text">No contact submissions yet</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = contacts.map(contact => `
            <div class="item-card" data-id="${contact.id}">
                <div class="item-header">
                    <div class="item-meta">
                        <h3 class="item-name">${contact.name}</h3>
                        <div class="item-date">${formatDate(contact.timestamp)}</div>
                    </div>
                    <span class="item-status ${contact.status || 'new'}">${contact.status || 'New'}</span>
                </div>
                <div class="item-body">
                    <div class="item-field">
                        <span class="item-field-label">Email:</span>
                        <span class="item-field-value"><a href="mailto:${contact.email}" style="color: var(--primary-color);">${contact.email}</a></span>
                    </div>
                    ${contact.company ? `
                    <div class="item-field">
                        <span class="item-field-label">Company:</span>
                        <span class="item-field-value">${contact.company}</span>
                    </div>` : ''}
                    ${contact.phone ? `
                    <div class="item-field">
                        <span class="item-field-label">Phone:</span>
                        <span class="item-field-value"><a href="tel:${contact.phone}" style="color: var(--primary-color);">${contact.phone}</a></span>
                    </div>` : ''}
                    ${contact.message ? `
                    <div class="item-field">
                        <span class="item-field-label">Message:</span>
                        <span class="item-field-value">${contact.message}</span>
                    </div>` : ''}
                </div>
                <div class="item-actions">
                    ${contact.status !== 'accepted' ? `
                        <button class="btn btn-success btn-small" onclick="acceptContact('${contact.id}')">Accept & Add to Clients</button>
                    ` : ''}
                    <button class="btn btn-danger btn-small" onclick="deleteContact('${contact.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error rendering contacts:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <p class="empty-state-text">Error loading contacts: ${error.message}</p>
            </div>
        `;
    }
}

// Render service requests
async function renderRequests() {
    const container = document.getElementById('requestsList');
    
    try {
        let requests;
        if (API.useWorkerAPI()) {
            requests = await API.request(window.API_CONFIG.ENDPOINTS.ADMIN_REQUESTS);
        } else {
            requests = getDataLocal(STORAGE_KEYS.REQUESTS);
        }
        
        if (requests.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <p class="empty-state-text">No service requests yet</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = requests.map(request => `
            <div class="item-card" data-id="${request.id}">
                <div class="item-header">
                    <div class="item-meta">
                        <h3 class="item-name">${request.companyName}</h3>
                        <div class="item-date">${formatDate(request.timestamp)}</div>
                    </div>
                    <span class="item-status ${request.status || 'new'}">${request.status || 'New'}</span>
                </div>
                <div class="item-body">
                    <div class="item-field">
                        <span class="item-field-label">Plan:</span>
                        <span class="item-field-value"><strong>${request.planName}</strong></span>
                    </div>
                    <div class="item-field">
                        <span class="item-field-label">Contact:</span>
                        <span class="item-field-value">${request.contactName}</span>
                    </div>
                    <div class="item-field">
                        <span class="item-field-label">Email:</span>
                        <span class="item-field-value"><a href="mailto:${request.email}" style="color: var(--primary-color);">${request.email}</a></span>
                    </div>
                    <div class="item-field">
                        <span class="item-field-label">Phone:</span>
                        <span class="item-field-value"><a href="tel:${request.phone}" style="color: var(--primary-color);">${request.phone}</a></span>
                    </div>
                    ${request.companySize ? `
                    <div class="item-field">
                        <span class="item-field-label">Company Size:</span>
                        <span class="item-field-value">${request.companySize}</span>
                    </div>` : ''}
                    ${request.address ? `
                    <div class="item-field">
                        <span class="item-field-label">Address:</span>
                        <span class="item-field-value">${request.address}</span>
                    </div>` : ''}
                    <div class="item-field">
                        <span class="item-field-label">Monthly:</span>
                        <span class="item-field-value">${request.monthlyTotal}</span>
                    </div>
                    <div class="item-field">
                        <span class="item-field-label">Setup Fee:</span>
                        <span class="item-field-value">${request.setupFee}</span>
                    </div>
                    ${request.notes ? `
                    <div class="item-field">
                        <span class="item-field-label">Notes:</span>
                        <span class="item-field-value">${request.notes}</span>
                    </div>` : ''}
                </div>
                <div class="item-actions">
                    ${request.status !== 'accepted' ? `
                        <button class="btn btn-success btn-small" onclick="acceptRequest('${request.id}')">Accept & Add to Clients</button>
                    ` : ''}
                    <button class="btn btn-danger btn-small" onclick="deleteRequest('${request.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error rendering requests:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <p class="empty-state-text">Error loading requests: ${error.message}</p>
            </div>
        `;
    }
}

// Render clients
async function renderClients() {
    const container = document.getElementById('clientsList');
    
    try {
        let clients;
        if (API.useWorkerAPI()) {
            clients = await API.request(window.API_CONFIG.ENDPOINTS.ADMIN_CLIENTS);
        } else {
            clients = getDataLocal(STORAGE_KEYS.CLIENTS);
        }
        
        if (clients.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <p class="empty-state-text">No clients yet</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = clients.map(client => `
            <div class="item-card" data-id="${client.id}">
                <div class="item-header">
                    <div class="item-meta">
                        <h3 class="item-name">${client.name}</h3>
                        <div class="item-date">Added: ${formatDate(client.acceptedDate)}</div>
                    </div>
                    <span class="item-status accepted">Active Client</span>
                </div>
                <div class="item-body">
                    ${client.company ? `
                    <div class="item-field">
                        <span class="item-field-label">Company:</span>
                        <span class="item-field-value">${client.company}</span>
                    </div>` : ''}
                    <div class="item-field">
                        <span class="item-field-label">Email:</span>
                        <span class="item-field-value"><a href="mailto:${client.email}" style="color: var(--primary-color);">${client.email}</a></span>
                    </div>
                    ${client.phone ? `
                    <div class="item-field">
                        <span class="item-field-label">Phone:</span>
                        <span class="item-field-value"><a href="tel:${client.phone}" style="color: var(--primary-color);">${client.phone}</a></span>
                    </div>` : ''}
                    ${client.address ? `
                    <div class="item-field">
                        <span class="item-field-label">Address:</span>
                        <span class="item-field-value">${client.address}</span>
                    </div>` : ''}
                    ${client.plan ? `
                    <div class="item-field">
                        <span class="item-field-label">Plan:</span>
                        <span class="item-field-value"><strong>${client.plan}</strong></span>
                    </div>` : ''}
                    ${client.monthlyValue ? `
                    <div class="item-field">
                        <span class="item-field-label">Monthly Value:</span>
                        <span class="item-field-value">${client.monthlyValue}</span>
                    </div>` : ''}
                    ${client.originalSubmission ? `
                    <div class="item-field">
                        <span class="item-field-label">Original Date:</span>
                        <span class="item-field-value">${formatDate(client.originalSubmission)}</span>
                    </div>` : ''}
                </div>
                <div class="item-actions">
                    <button class="btn btn-danger btn-small" onclick="deleteClient('${client.id}')">Remove Client</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error rendering clients:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <p class="empty-state-text">Error loading clients: ${error.message}</p>
            </div>
        `;
    }
}

// Accept contact and add to clients
async function acceptContact(id) {
    try {
        if (API.useWorkerAPI()) {
            await API.request(window.API_CONFIG.ENDPOINTS.CONTACT_ACCEPT, {
                method: 'POST',
                body: JSON.stringify({ id })
            });
        } else {
            // localStorage fallback
            const contacts = getDataLocal(STORAGE_KEYS.CONTACTS);
            const contact = contacts.find(c => c.id === id);
            
            if (!contact) return;
            
            contact.status = 'accepted';
            saveDataLocal(STORAGE_KEYS.CONTACTS, contacts);
            
            const clients = getDataLocal(STORAGE_KEYS.CLIENTS);
            clients.push({
                id: 'client_' + Date.now(),
                name: contact.name,
                company: contact.company || '',
                email: contact.email,
                phone: contact.phone || '',
                acceptedDate: Date.now(),
                originalSubmission: contact.timestamp,
                source: 'contact_form'
            });
            saveDataLocal(STORAGE_KEYS.CLIENTS, clients);
        }
        
        // Re-render
        await renderContacts();
        await renderClients();
    } catch (error) {
        console.error('Error accepting contact:', error);
        alert('Error accepting contact: ' + error.message);
    }
}

// Accept service request and add to clients
async function acceptRequest(id) {
    try {
        if (API.useWorkerAPI()) {
            await API.request(window.API_CONFIG.ENDPOINTS.REQUEST_ACCEPT, {
                method: 'POST',
                body: JSON.stringify({ id })
            });
        } else {
            // localStorage fallback
            const requests = getDataLocal(STORAGE_KEYS.REQUESTS);
            const request = requests.find(r => r.id === id);
            
            if (!request) return;
            
            request.status = 'accepted';
            saveDataLocal(STORAGE_KEYS.REQUESTS, requests);
            
            const clients = getDataLocal(STORAGE_KEYS.CLIENTS);
            clients.push({
                id: 'client_' + Date.now(),
                name: request.contactName,
                company: request.companyName,
                email: request.email,
                phone: request.phone,
                address: request.address || '',
                plan: request.planName,
                monthlyValue: request.monthlyTotal,
                acceptedDate: Date.now(),
                originalSubmission: request.timestamp,
                source: 'service_request'
            });
            saveDataLocal(STORAGE_KEYS.CLIENTS, clients);
        }
        
        // Re-render
        await renderRequests();
        await renderClients();
    } catch (error) {
        console.error('Error accepting request:', error);
        alert('Error accepting request: ' + error.message);
    }
}

// Delete contact
async function deleteContact(id) {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    try {
        if (API.useWorkerAPI()) {
            await API.request(`${window.API_CONFIG.ENDPOINTS.CONTACT_DELETE}${id}`, {
                method: 'DELETE'
            });
        } else {
            // localStorage fallback
            const contacts = getDataLocal(STORAGE_KEYS.CONTACTS);
            const filtered = contacts.filter(item => item.id !== id);
            saveDataLocal(STORAGE_KEYS.CONTACTS, filtered);
        }
        
        await renderContacts();
    } catch (error) {
        console.error('Error deleting contact:', error);
        alert('Error deleting contact: ' + error.message);
    }
}

// Delete request
async function deleteRequest(id) {
    if (!confirm('Are you sure you want to delete this request?')) return;
    
    try {
        if (API.useWorkerAPI()) {
            await API.request(`${window.API_CONFIG.ENDPOINTS.REQUEST_DELETE}${id}`, {
                method: 'DELETE'
            });
        } else {
            // localStorage fallback
            const requests = getDataLocal(STORAGE_KEYS.REQUESTS);
            const filtered = requests.filter(item => item.id !== id);
            saveDataLocal(STORAGE_KEYS.REQUESTS, filtered);
        }
        
        await renderRequests();
    } catch (error) {
        console.error('Error deleting request:', error);
        alert('Error deleting request: ' + error.message);
    }
}

// Delete client
async function deleteClient(id) {
    if (!confirm('Are you sure you want to remove this client?')) return;
    
    try {
        if (API.useWorkerAPI()) {
            await API.request(`${window.API_CONFIG.ENDPOINTS.CLIENT_DELETE}${id}`, {
                method: 'DELETE'
            });
        } else {
            // localStorage fallback
            const clients = getDataLocal(STORAGE_KEYS.CLIENTS);
            const filtered = clients.filter(client => client.id !== id);
            saveDataLocal(STORAGE_KEYS.CLIENTS, filtered);
        }
        
        await renderClients();
    } catch (error) {
        console.error('Error deleting client:', error);
        alert('Error deleting client: ' + error.message);
    }
}

// Export data to CSV
function exportData(type) {
    let data, filename, headers;
    
    if (type === 'contacts') {
        data = API.useWorkerAPI() ? [] : getDataLocal(STORAGE_KEYS.CONTACTS);
        filename = 'contacts.csv';
        headers = ['Name', 'Email', 'Company', 'Phone', 'Message', 'Date', 'Status'];
    } else if (type === 'requests') {
        data = API.useWorkerAPI() ? [] : getDataLocal(STORAGE_KEYS.REQUESTS);
        filename = 'service-requests.csv';
        headers = ['Company', 'Contact', 'Email', 'Phone', 'Plan', 'Monthly', 'Setup Fee', 'Date', 'Status'];
    } else if (type === 'clients') {
        data = API.useWorkerAPI() ? [] : getDataLocal(STORAGE_KEYS.CLIENTS);
        filename = 'clients.csv';
        headers = ['Name', 'Company', 'Email', 'Phone', 'Plan', 'Monthly Value', 'Accepted Date'];
    }
    
    if (API.useWorkerAPI()) {
        alert('CSV export is not yet available when using Cloudflare Worker API. Please use the Cloudflare dashboard or wrangler CLI to export data.');
        return;
    }
    
    if (data.length === 0) {
        alert('No data to export');
        return;
    }
    
    // Build CSV
    let csv = headers.join(',') + '\n';
    
    data.forEach(item => {
        let row = [];
        if (type === 'contacts') {
            row = [
                item.name || '',
                item.email || '',
                item.company || '',
                item.phone || '',
                (item.message || '').replace(/,/g, ';'),
                formatDate(item.timestamp),
                item.status || 'new'
            ];
        } else if (type === 'requests') {
            row = [
                item.companyName || '',
                item.contactName || '',
                item.email || '',
                item.phone || '',
                item.planName || '',
                item.monthlyTotal || '',
                item.setupFee || '',
                formatDate(item.timestamp),
                item.status || 'new'
            ];
        } else if (type === 'clients') {
            row = [
                item.name || '',
                item.company || '',
                item.email || '',
                item.phone || '',
                item.plan || '',
                item.monthlyValue || '',
                formatDate(item.acceptedDate)
            ];
        }
        csv += row.map(field => `"${field}"`).join(',') + '\n';
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Content management placeholders
function saveContent(section) {
    alert(`Content management for ${section} saved! (This would integrate with your backend)`);
}

function addFeature() {
    alert('Add feature functionality would be implemented here');
}

// Tab switching
function setupTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active content
            contents.forEach(c => c.classList.remove('active'));
            document.getElementById(`tab-${targetTab}`).classList.add('active');
        });
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    initStorage();
    
    // Check authentication
    if (checkAuth()) {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        setupTabs();
        
        // Load data
        await renderContacts();
        await renderRequests();
        await renderClients();
    } else {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('adminDashboard').style.display = 'none';
    }
    
    // Login form
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('password').value;
        const result = await login(password);
        
        if (result.success) {
            window.location.reload();
        } else {
            const errorEl = document.getElementById('loginError');
            errorEl.textContent = result.message;
            errorEl.style.display = 'block';
        }
    });
    
    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
});

// Expose functions to window for inline onclick handlers
window.acceptContact = acceptContact;
window.acceptRequest = acceptRequest;
window.deleteContact = deleteContact;
window.deleteRequest = deleteRequest;
window.deleteClient = deleteClient;
window.exportData = exportData;
window.saveContent = saveContent;
window.addFeature = addFeature;
