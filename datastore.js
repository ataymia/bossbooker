/**
 * BossBooker Data Layer Module
 * LocalStorage-backed data persistence with Firebase-ready interface
 * 
 * LocalStorage Keys:
 * - bb_visitors: Map of visitor profiles by visitor_id
 * - bb_events: Array of analytics events (capped at 5000)
 * - bb_leads: Array of contact form submissions
 * - bb_plan_requests: Array of plan/service requests
 * 
 * TODO: Firebase Implementation
 * - Replace localStorage calls with Firestore SDK
 * - Add authentication for admin operations
 * - Implement real-time listeners for dashboard updates
 */

(function(global) {
  'use strict';

  const STORAGE_KEYS = {
    VISITORS: 'bb_visitors',
    EVENTS: 'bb_events',
    LEADS: 'bb_leads',
    PLAN_REQUESTS: 'bb_plan_requests'
  };

  const MAX_EVENTS = 5000;

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  function safeGet(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.warn('[DataStore] Error reading from localStorage:', key, e);
      return defaultValue;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('[DataStore] Error writing to localStorage:', key, e);
      return false;
    }
  }

  // ============================================
  // VISITOR MANAGEMENT
  // ============================================

  /**
   * Get or create a visitor profile
   * @param {string} visitorId - Unique visitor identifier
   * @returns {Object} Visitor profile
   */
  function getVisitor(visitorId) {
    const visitors = safeGet(STORAGE_KEYS.VISITORS, {});
    return visitors[visitorId] || null;
  }

  /**
   * Save or update a visitor profile
   * @param {Object} visitor - Visitor object with id and properties
   * @returns {boolean} Success status
   */
  function saveVisitor(visitor) {
    if (!visitor || !visitor.id) {
      console.warn('[DataStore] Invalid visitor object');
      return false;
    }
    
    const visitors = safeGet(STORAGE_KEYS.VISITORS, {});
    visitors[visitor.id] = {
      ...visitors[visitor.id],
      ...visitor,
      updated_at: Date.now()
    };
    
    return safeSet(STORAGE_KEYS.VISITORS, visitors);
  }

  /**
   * List all visitors
   * @param {Object} options - Filter options
   * @returns {Array} Array of visitor objects
   */
  function listVisitors(options = {}) {
    const visitors = safeGet(STORAGE_KEYS.VISITORS, {});
    let result = Object.values(visitors);

    // Sort by last_seen descending by default
    result.sort((a, b) => (b.last_seen || 0) - (a.last_seen || 0));

    // Apply limit if specified
    if (options.limit && options.limit > 0) {
      result = result.slice(0, options.limit);
    }

    return result;
  }

  /**
   * Get visitor count for a date range
   * @param {number} startTime - Start timestamp
   * @param {number} endTime - End timestamp
   * @returns {number} Count of unique visitors
   */
  function countVisitors(startTime, endTime) {
    const visitors = safeGet(STORAGE_KEYS.VISITORS, {});
    return Object.values(visitors).filter(v => {
      const seen = v.last_seen || v.first_seen || 0;
      return seen >= startTime && seen <= endTime;
    }).length;
  }

  // ============================================
  // EVENT LOGGING
  // ============================================

  /**
   * Log an analytics event
   * @param {Object} eventData - Event data
   * @returns {boolean} Success status
   * 
   * Event Schema:
   * - id: string (auto-generated)
   * - type: string (page_view, click, form_submit, quiz_start, quiz_complete, etc.)
   * - label: string (human-readable label)
   * - page: string (page URL or path)
   * - visitor_id: string
   * - session_id: string
   * - timestamp: number
   * - meta: object (additional data)
   */
  function logEvent(eventData) {
    if (!eventData || !eventData.type) {
      console.warn('[DataStore] Invalid event data');
      return false;
    }

    const events = safeGet(STORAGE_KEYS.EVENTS, []);
    
    const event = {
      id: generateId('evt'),
      type: eventData.type,
      label: eventData.label || '',
      page: eventData.page || window.location.pathname,
      visitor_id: eventData.visitor_id || '',
      session_id: eventData.session_id || '',
      timestamp: eventData.timestamp || Date.now(),
      meta: eventData.meta || {}
    };

    events.unshift(event);

    // Cap events to prevent localStorage overflow
    if (events.length > MAX_EVENTS) {
      events.length = MAX_EVENTS;
    }

    return safeSet(STORAGE_KEYS.EVENTS, events);
  }

  /**
   * List analytics events
   * @param {Object} options - Filter options
   * @returns {Array} Array of events
   */
  function listEvents(options = {}) {
    let events = safeGet(STORAGE_KEYS.EVENTS, []);

    // Filter by type
    if (options.type) {
      events = events.filter(e => e.type === options.type);
    }

    // Filter by types (array)
    if (options.types && Array.isArray(options.types)) {
      events = events.filter(e => options.types.includes(e.type));
    }

    // Filter by visitor
    if (options.visitor_id) {
      events = events.filter(e => e.visitor_id === options.visitor_id);
    }

    // Filter by date range
    if (options.startTime) {
      events = events.filter(e => e.timestamp >= options.startTime);
    }
    if (options.endTime) {
      events = events.filter(e => e.timestamp <= options.endTime);
    }

    // Filter by page
    if (options.page) {
      events = events.filter(e => e.page === options.page || e.page.includes(options.page));
    }

    // Apply limit
    if (options.limit && options.limit > 0) {
      events = events.slice(0, options.limit);
    }

    return events;
  }

  /**
   * Count events by type within a date range
   * @param {string} type - Event type
   * @param {number} startTime - Start timestamp
   * @param {number} endTime - End timestamp
   * @returns {number} Event count
   */
  function countEvents(type, startTime, endTime) {
    const events = safeGet(STORAGE_KEYS.EVENTS, []);
    return events.filter(e => {
      const typeMatch = type ? e.type === type : true;
      const timeMatch = e.timestamp >= startTime && e.timestamp <= endTime;
      return typeMatch && timeMatch;
    }).length;
  }

  /**
   * Get event aggregations (top pages, top clicks, etc.)
   * @param {Object} options - Aggregation options
   * @returns {Object} Aggregated data
   */
  function getEventAggregations(options = {}) {
    const startTime = options.startTime || 0;
    const endTime = options.endTime || Date.now();
    
    const events = listEvents({ startTime, endTime });
    
    // Top pages by views
    const pageViews = {};
    events.filter(e => e.type === 'page_view').forEach(e => {
      const page = e.page || 'unknown';
      pageViews[page] = (pageViews[page] || 0) + 1;
    });
    
    const topPages = Object.entries(pageViews)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top clicks
    const clicks = {};
    events.filter(e => e.type === 'click').forEach(e => {
      const key = `${e.label || 'unknown'} (${e.page})`;
      clicks[key] = (clicks[key] || 0) + 1;
    });
    
    const topClicks = Object.entries(clicks)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Conversion counts
    const conversions = {
      lead_submit: events.filter(e => e.type === 'lead_submit').length,
      plan_request: events.filter(e => e.type === 'plan_request').length,
      quiz_complete: events.filter(e => e.type === 'quiz_complete').length,
      quiz_start: events.filter(e => e.type === 'quiz_start').length
    };

    return {
      topPages,
      topClicks,
      conversions,
      totalEvents: events.length
    };
  }

  // ============================================
  // LEADS MANAGEMENT
  // ============================================

  /**
   * Save a new lead (contact form submission)
   * @param {Object} leadData - Lead information
   * @returns {Object} Saved lead with ID
   * 
   * Lead Schema:
   * - id: string
   * - created_at: number
   * - name: string
   * - email: string
   * - phone: string
   * - company: string
   * - subject: string
   * - message: string
   * - source_page: string
   * - referrer: string
   * - utm: object
   * - status: string (new, contacted, booked, archived)
   * - notes: string
   */
  function saveLead(leadData) {
    const leads = safeGet(STORAGE_KEYS.LEADS, []);
    
    const lead = {
      id: generateId('lead'),
      created_at: Date.now(),
      name: leadData.name || '',
      email: leadData.email || '',
      phone: leadData.phone || '',
      company: leadData.company || '',
      subject: leadData.subject || '',
      message: leadData.message || '',
      source_page: leadData.source_page || window.location.pathname,
      referrer: leadData.referrer || document.referrer || '',
      utm: leadData.utm || {},
      visitor_id: leadData.visitor_id || '',
      status: 'new',
      notes: ''
    };

    leads.unshift(lead);
    safeSet(STORAGE_KEYS.LEADS, leads);
    
    return lead;
  }

  /**
   * List all leads
   * @param {Object} options - Filter options
   * @returns {Array} Array of leads
   */
  function listLeads(options = {}) {
    let leads = safeGet(STORAGE_KEYS.LEADS, []);

    // Filter by status
    if (options.status) {
      leads = leads.filter(l => l.status === options.status);
    }

    // Filter by date range
    if (options.startTime) {
      leads = leads.filter(l => l.created_at >= options.startTime);
    }
    if (options.endTime) {
      leads = leads.filter(l => l.created_at <= options.endTime);
    }

    // Apply limit
    if (options.limit && options.limit > 0) {
      leads = leads.slice(0, options.limit);
    }

    return leads;
  }

  /**
   * Update a lead's status or notes
   * @param {string} leadId - Lead ID
   * @param {Object} updates - Fields to update
   * @returns {Object|null} Updated lead or null
   */
  function updateLead(leadId, updates) {
    const leads = safeGet(STORAGE_KEYS.LEADS, []);
    const index = leads.findIndex(l => l.id === leadId);
    
    if (index === -1) {
      console.warn('[DataStore] Lead not found:', leadId);
      return null;
    }

    // Only allow updating certain fields
    const allowedFields = ['status', 'notes'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        leads[index][field] = updates[field];
      }
    });
    
    leads[index].updated_at = Date.now();
    safeSet(STORAGE_KEYS.LEADS, leads);
    
    return leads[index];
  }

  /**
   * Get a single lead by ID
   * @param {string} leadId - Lead ID
   * @returns {Object|null} Lead or null
   */
  function getLead(leadId) {
    const leads = safeGet(STORAGE_KEYS.LEADS, []);
    return leads.find(l => l.id === leadId) || null;
  }

  // ============================================
  // PLAN REQUESTS MANAGEMENT
  // ============================================

  /**
   * Save a plan request
   * @param {Object} requestData - Plan request data
   * @returns {Object} Saved request with ID
   * 
   * Plan Request Schema:
   * - id: string
   * - created_at: number
   * - name: string
   * - email: string
   * - phone: string
   * - company: string
   * - plan_name: string
   * - plan_details: object (monthly, setup, addons, etc.)
   * - source_page: string
   * - referrer: string
   * - visitor_id: string
   * - status: string (new, contacted, booked, archived)
   * - notes: string
   */
  function savePlanRequest(requestData) {
    const requests = safeGet(STORAGE_KEYS.PLAN_REQUESTS, []);
    
    const request = {
      id: generateId('req'),
      created_at: Date.now(),
      name: requestData.name || requestData.contactName || '',
      email: requestData.email || '',
      phone: requestData.phone || '',
      company: requestData.company || requestData.companyName || '',
      plan_name: requestData.planName || requestData.plan_name || '',
      plan_details: {
        monthly: requestData.monthlyTotal || requestData.monthly || '',
        setup: requestData.setupFee || requestData.setup || '',
        first_month: requestData.firstMonthTotal || requestData.first_month || '',
        addons: requestData.addons || [],
        business_cards: requestData.businessCardSelection || null
      },
      company_size: requestData.companySize || '',
      address: requestData.address || '',
      additional_notes: requestData.notes || '',
      source_page: requestData.source_page || window.location.pathname,
      referrer: requestData.referrer || document.referrer || '',
      visitor_id: requestData.visitor_id || '',
      status: 'new',
      notes: ''
    };

    requests.unshift(request);
    safeSet(STORAGE_KEYS.PLAN_REQUESTS, requests);
    
    return request;
  }

  /**
   * List all plan requests
   * @param {Object} options - Filter options
   * @returns {Array} Array of requests
   */
  function listPlanRequests(options = {}) {
    let requests = safeGet(STORAGE_KEYS.PLAN_REQUESTS, []);

    // Filter by status
    if (options.status) {
      requests = requests.filter(r => r.status === options.status);
    }

    // Filter by date range
    if (options.startTime) {
      requests = requests.filter(r => r.created_at >= options.startTime);
    }
    if (options.endTime) {
      requests = requests.filter(r => r.created_at <= options.endTime);
    }

    // Apply limit
    if (options.limit && options.limit > 0) {
      requests = requests.slice(0, options.limit);
    }

    return requests;
  }

  /**
   * Update a plan request
   * @param {string} requestId - Request ID
   * @param {Object} updates - Fields to update
   * @returns {Object|null} Updated request or null
   */
  function updatePlanRequest(requestId, updates) {
    const requests = safeGet(STORAGE_KEYS.PLAN_REQUESTS, []);
    const index = requests.findIndex(r => r.id === requestId);
    
    if (index === -1) {
      console.warn('[DataStore] Plan request not found:', requestId);
      return null;
    }

    const allowedFields = ['status', 'notes'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        requests[index][field] = updates[field];
      }
    });
    
    requests[index].updated_at = Date.now();
    safeSet(STORAGE_KEYS.PLAN_REQUESTS, requests);
    
    return requests[index];
  }

  /**
   * Get a single plan request by ID
   * @param {string} requestId - Request ID
   * @returns {Object|null} Request or null
   */
  function getPlanRequest(requestId) {
    const requests = safeGet(STORAGE_KEYS.PLAN_REQUESTS, []);
    return requests.find(r => r.id === requestId) || null;
  }

  // ============================================
  // EXPORT & CLEAR FUNCTIONS
  // ============================================

  /**
   * Export all data as JSON
   * @returns {Object} All stored data
   */
  function exportAllData() {
    return {
      visitors: safeGet(STORAGE_KEYS.VISITORS, {}),
      events: safeGet(STORAGE_KEYS.EVENTS, []),
      leads: safeGet(STORAGE_KEYS.LEADS, []),
      plan_requests: safeGet(STORAGE_KEYS.PLAN_REQUESTS, []),
      exported_at: new Date().toISOString()
    };
  }

  /**
   * Export data as CSV string
   * @param {string} dataType - Type of data to export (leads, plan_requests, events)
   * @returns {string} CSV formatted string
   */
  function exportToCSV(dataType) {
    let data = [];
    let headers = [];

    switch (dataType) {
      case 'leads':
        data = listLeads();
        headers = ['id', 'created_at', 'name', 'email', 'phone', 'company', 'subject', 'message', 'source_page', 'referrer', 'status', 'notes'];
        break;
      case 'plan_requests':
        data = listPlanRequests();
        headers = ['id', 'created_at', 'name', 'email', 'phone', 'company', 'plan_name', 'monthly', 'setup', 'company_size', 'status', 'notes'];
        data = data.map(r => ({
          ...r,
          monthly: r.plan_details?.monthly || '',
          setup: r.plan_details?.setup || ''
        }));
        break;
      case 'events':
        data = listEvents({ limit: 5000 });
        headers = ['id', 'timestamp', 'type', 'label', 'page', 'visitor_id', 'session_id'];
        break;
      case 'visitors':
        data = listVisitors();
        headers = ['id', 'first_seen', 'last_seen', 'page_count', 'referrer', 'device', 'screen_size', 'timezone'];
        data = data.map(v => ({
          ...v,
          page_count: v.pages_visited?.length || 0,
          device: v.device_hints?.device || '',
          screen_size: v.device_hints?.screen || '',
          timezone: v.device_hints?.timezone || ''
        }));
        break;
      default:
        return '';
    }

    if (data.length === 0) return '';

    // Create CSV content
    const escape = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };

    const rows = [headers.join(',')];
    data.forEach(item => {
      const row = headers.map(h => escape(item[h]));
      rows.push(row.join(','));
    });

    return rows.join('\n');
  }

  /**
   * Clear all admin data (with confirmation)
   * @param {boolean} confirmed - Must be true to proceed
   * @returns {boolean} Success status
   */
  function clearAllData(confirmed) {
    if (confirmed !== true) {
      console.warn('[DataStore] Clear operation not confirmed');
      return false;
    }

    try {
      localStorage.removeItem(STORAGE_KEYS.VISITORS);
      localStorage.removeItem(STORAGE_KEYS.EVENTS);
      localStorage.removeItem(STORAGE_KEYS.LEADS);
      localStorage.removeItem(STORAGE_KEYS.PLAN_REQUESTS);
      return true;
    } catch (e) {
      console.error('[DataStore] Error clearing data:', e);
      return false;
    }
  }

  /**
   * Get dashboard stats for a time range
   * @param {number} days - Number of days to look back
   * @returns {Object} Dashboard statistics
   */
  function getDashboardStats(days = 7) {
    const now = Date.now();
    const startTime = now - (days * 24 * 60 * 60 * 1000);
    const endTime = now;

    const visitors = listVisitors();
    const recentVisitors = visitors.filter(v => (v.last_seen || v.first_seen || 0) >= startTime);

    const events = listEvents({ startTime, endTime });
    const pageViews = events.filter(e => e.type === 'page_view').length;
    
    // Count unique sessions
    const sessions = new Set(events.map(e => e.session_id).filter(Boolean)).size;

    const aggregations = getEventAggregations({ startTime, endTime });

    const leads = listLeads({ startTime, endTime });
    const planRequests = listPlanRequests({ startTime, endTime });

    return {
      period: {
        days,
        startTime,
        endTime
      },
      visitors: {
        total: visitors.length,
        recent: recentVisitors.length
      },
      sessions,
      pageViews,
      ...aggregations,
      leads: {
        total: leads.length,
        new: leads.filter(l => l.status === 'new').length
      },
      planRequests: {
        total: planRequests.length,
        new: planRequests.filter(r => r.status === 'new').length
      }
    };
  }

  // ============================================
  // PUBLIC API
  // ============================================

  const DataStore = {
    // Constants
    STORAGE_KEYS,
    
    // Visitors
    getVisitor,
    saveVisitor,
    listVisitors,
    countVisitors,
    
    // Events
    logEvent,
    listEvents,
    countEvents,
    getEventAggregations,
    
    // Leads
    saveLead,
    listLeads,
    updateLead,
    getLead,
    
    // Plan Requests
    savePlanRequest,
    listPlanRequests,
    updatePlanRequest,
    getPlanRequest,
    
    // Export & Admin
    exportAllData,
    exportToCSV,
    clearAllData,
    getDashboardStats,
    
    // Utilities
    generateId
  };

  // Expose to global scope
  global.DataStore = DataStore;

  // Also support module exports if available
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataStore;
  }

})(typeof window !== 'undefined' ? window : this);
