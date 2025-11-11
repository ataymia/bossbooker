// Boss Booker API Configuration
// Update WORKER_URL with your actual Cloudflare Worker URL after deployment
const API_CONFIG = {
  // Replace with your actual worker URL from: wrangler deploy
  // Example: 'https://bossbooker-api.your-subdomain.workers.dev'
  WORKER_URL: 'https://bossbooker-api.YOUR-SUBDOMAIN.workers.dev',
  
  // Set to true to use localStorage fallback (for testing without worker)
  USE_LOCALSTORAGE_FALLBACK: false,
  
  // API endpoints
  ENDPOINTS: {
    CONTACT: '/api/contact',
    REQUEST: '/api/request',
    ADMIN_AUTH: '/api/admin/auth',
    ADMIN_CONTACTS: '/api/admin/contacts',
    ADMIN_REQUESTS: '/api/admin/requests',
    ADMIN_CLIENTS: '/api/admin/clients',
    CONTACT_DELETE: '/api/admin/contact/',
    REQUEST_DELETE: '/api/admin/request/',
    CLIENT_DELETE: '/api/admin/client/',
    CONTACT_ACCEPT: '/api/admin/contact/accept',
    REQUEST_ACCEPT: '/api/admin/request/accept',
  }
};

// Make it available globally
window.API_CONFIG = API_CONFIG;
