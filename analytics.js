/**
 * BossBooker Analytics Module
 * Lightweight, privacy-friendly analytics for static sites
 * 
 * Features:
 * - Visitor identification (localStorage persistent UUID)
 * - Session tracking (sessionStorage UUID)
 * - Automatic page view tracking
 * - Click tracking via [data-track] attributes
 * - Event taxonomy for consistent tracking
 * - Respects prefers-reduced-motion for UX
 * 
 * Dependencies:
 * - datastore.js must be loaded first
 */

(function(global) {
  'use strict';

  // ============================================
  // CONFIGURATION
  // ============================================

  const CONFIG = {
    // Enable/disable geo enrichment (requires external API)
    ENABLE_GEO_ENRICHMENT: false,
    GEO_API_URL: 'https://ipapi.co/json/',
    
    // Storage keys
    VISITOR_ID_KEY: 'bb_visitor_id',
    SESSION_ID_KEY: 'bb_session_id',
    
    // Auto-tracking settings
    AUTO_TRACK_PAGEVIEWS: true,
    AUTO_TRACK_CLICKS: true,
    AUTO_TRACK_FORMS: true,
    
    // Debug mode
    DEBUG: false
  };

  // ============================================
  // EVENT TYPES (Taxonomy)
  // ============================================

  const EVENT_TYPES = {
    PAGE_VIEW: 'page_view',
    CLICK: 'click',
    NAV_CLICK: 'nav_click',
    CTA_CLICK: 'cta_click',
    FORM_SUBMIT: 'form_submit',
    LEAD_SUBMIT: 'lead_submit',
    PLAN_REQUEST: 'plan_request',
    QUIZ_START: 'quiz_start',
    QUIZ_COMPLETE: 'quiz_complete',
    PLAN_SELECT: 'plan_select',
    ADDON_SELECT: 'addon_select',
    MODAL_OPEN: 'modal_open',
    MODAL_CLOSE: 'modal_close',
    OUTBOUND_CLICK: 'outbound_click',
    PHONE_CLICK: 'phone_click',
    EMAIL_CLICK: 'email_click',
    SCROLL_DEPTH: 'scroll_depth',
    SESSION_START: 'session_start'
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function log(...args) {
    if (CONFIG.DEBUG) {
      console.log('[Analytics]', ...args);
    }
  }

  function parseUserAgent() {
    const ua = navigator.userAgent;
    let device = 'desktop';
    let browser = 'unknown';
    let os = 'unknown';

    // Device detection
    if (/mobile/i.test(ua)) device = 'mobile';
    else if (/tablet|ipad/i.test(ua)) device = 'tablet';

    // Browser detection
    if (/firefox/i.test(ua)) browser = 'Firefox';
    else if (/edg/i.test(ua)) browser = 'Edge';
    else if (/chrome/i.test(ua)) browser = 'Chrome';
    else if (/safari/i.test(ua)) browser = 'Safari';
    else if (/msie|trident/i.test(ua)) browser = 'IE';

    // OS detection
    if (/windows/i.test(ua)) os = 'Windows';
    else if (/macintosh|mac os/i.test(ua)) os = 'macOS';
    else if (/linux/i.test(ua)) os = 'Linux';
    else if (/android/i.test(ua)) os = 'Android';
    else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';

    return { device, browser, os };
  }

  function getScreenSize() {
    return `${window.screen.width}x${window.screen.height}`;
  }

  function getTimezone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {
      return 'unknown';
    }
  }

  function getPagePath() {
    return window.location.pathname + window.location.search;
  }

  function getPageTitle() {
    return document.title || '';
  }

  function getReferrer() {
    return document.referrer || '';
  }

  function getUTMParams() {
    const params = new URLSearchParams(window.location.search);
    const utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(key => {
      const value = params.get(key);
      if (value) utm[key] = value;
    });
    return Object.keys(utm).length > 0 ? utm : null;
  }

  // ============================================
  // VISITOR & SESSION MANAGEMENT
  // ============================================

  let _visitorId = null;
  let _sessionId = null;
  let _isNewSession = false;

  /**
   * Get or create visitor ID (persistent across sessions)
   */
  function getVisitorId() {
    if (_visitorId) return _visitorId;

    try {
      _visitorId = localStorage.getItem(CONFIG.VISITOR_ID_KEY);
      if (!_visitorId) {
        _visitorId = generateUUID();
        localStorage.setItem(CONFIG.VISITOR_ID_KEY, _visitorId);
        log('New visitor created:', _visitorId);
      }
    } catch (e) {
      _visitorId = generateUUID();
      log('localStorage unavailable, using temporary visitor ID');
    }

    return _visitorId;
  }

  /**
   * Get or create session ID (per browser session)
   */
  function getSessionId() {
    if (_sessionId) return _sessionId;

    try {
      _sessionId = sessionStorage.getItem(CONFIG.SESSION_ID_KEY);
      if (!_sessionId) {
        _sessionId = generateUUID();
        sessionStorage.setItem(CONFIG.SESSION_ID_KEY, _sessionId);
        _isNewSession = true;
        log('New session created:', _sessionId);
      }
    } catch (e) {
      _sessionId = generateUUID();
      _isNewSession = true;
      log('sessionStorage unavailable, using temporary session ID');
    }

    return _sessionId;
  }

  /**
   * Initialize or update visitor profile
   */
  function initVisitor() {
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    
    if (typeof DataStore === 'undefined') {
      log('DataStore not available, skipping visitor tracking');
      return;
    }

    const existingVisitor = DataStore.getVisitor(visitorId);
    const now = Date.now();
    const pagePath = getPagePath();

    const deviceHints = parseUserAgent();
    deviceHints.screen = getScreenSize();
    deviceHints.timezone = getTimezone();

    const visitor = {
      id: visitorId,
      first_seen: existingVisitor?.first_seen || now,
      last_seen: now,
      session_count: (existingVisitor?.session_count || 0) + (_isNewSession ? 1 : 0),
      pages_visited: existingVisitor?.pages_visited || [],
      referrer: existingVisitor?.referrer || getReferrer(),
      device_hints: deviceHints,
      utm: existingVisitor?.utm || getUTMParams()
    };

    // Add current page if not already in list (keep last 50)
    if (!visitor.pages_visited.includes(pagePath)) {
      visitor.pages_visited.push(pagePath);
      if (visitor.pages_visited.length > 50) {
        visitor.pages_visited = visitor.pages_visited.slice(-50);
      }
    }

    DataStore.saveVisitor(visitor);
    log('Visitor updated:', visitor);

    // Log session start event for new sessions
    if (_isNewSession) {
      trackEvent({
        type: EVENT_TYPES.SESSION_START,
        label: 'New Session',
        meta: {
          referrer: getReferrer(),
          utm: getUTMParams()
        }
      });
    }
  }

  // ============================================
  // EVENT TRACKING
  // ============================================

  /**
   * Track a page view
   */
  function trackPageView() {
    if (!CONFIG.AUTO_TRACK_PAGEVIEWS) return;

    trackEvent({
      type: EVENT_TYPES.PAGE_VIEW,
      label: getPageTitle(),
      meta: {
        referrer: getReferrer(),
        utm: getUTMParams()
      }
    });
  }

  /**
   * Track a custom event
   * @param {Object} eventData - Event data
   */
  function trackEvent(eventData) {
    if (typeof DataStore === 'undefined') {
      log('DataStore not available, event not tracked:', eventData);
      return;
    }

    const event = {
      type: eventData.type || 'custom',
      label: eventData.label || '',
      page: eventData.page || getPagePath(),
      visitor_id: getVisitorId(),
      session_id: getSessionId(),
      timestamp: eventData.timestamp || Date.now(),
      meta: eventData.meta || {}
    };

    DataStore.logEvent(event);
    log('Event tracked:', event);

    // Update visitor's last_seen
    const visitor = DataStore.getVisitor(event.visitor_id);
    if (visitor) {
      visitor.last_seen = Date.now();
      DataStore.saveVisitor(visitor);
    }
  }

  /**
   * Track a click event
   * @param {string} label - Click label
   * @param {Object} meta - Additional metadata
   */
  function trackClick(label, meta = {}) {
    trackEvent({
      type: EVENT_TYPES.CLICK,
      label,
      meta
    });
  }

  /**
   * Track CTA click
   * @param {string} label - CTA label
   * @param {Object} meta - Additional metadata
   */
  function trackCTA(label, meta = {}) {
    trackEvent({
      type: EVENT_TYPES.CTA_CLICK,
      label,
      meta
    });
  }

  /**
   * Track navigation click
   * @param {string} label - Nav item label
   * @param {string} href - Link destination
   */
  function trackNavClick(label, href) {
    trackEvent({
      type: EVENT_TYPES.NAV_CLICK,
      label,
      meta: { href }
    });
  }

  /**
   * Track form submission
   * @param {string} formId - Form identifier
   * @param {Object} meta - Additional metadata
   */
  function trackFormSubmit(formId, meta = {}) {
    trackEvent({
      type: EVENT_TYPES.FORM_SUBMIT,
      label: formId,
      meta
    });
  }

  /**
   * Track quiz events
   * @param {string} action - 'start' or 'complete'
   * @param {Object} meta - Quiz data
   */
  function trackQuiz(action, meta = {}) {
    trackEvent({
      type: action === 'complete' ? EVENT_TYPES.QUIZ_COMPLETE : EVENT_TYPES.QUIZ_START,
      label: `Quiz ${action}`,
      meta
    });
  }

  /**
   * Track plan selection/request
   * @param {string} planName - Selected plan name
   * @param {Object} meta - Plan details
   */
  function trackPlanSelect(planName, meta = {}) {
    trackEvent({
      type: EVENT_TYPES.PLAN_SELECT,
      label: planName,
      meta
    });
  }

  // ============================================
  // AUTO-TRACKING SETUP
  // ============================================

  /**
   * Setup click tracking for elements with [data-track] attribute
   */
  function setupClickTracking() {
    if (!CONFIG.AUTO_TRACK_CLICKS) return;

    document.addEventListener('click', function(e) {
      const target = e.target.closest('[data-track]');
      if (!target) return;

      const trackLabel = target.getAttribute('data-track');
      const trackType = target.getAttribute('data-track-type') || 'click';
      const trackMeta = target.getAttribute('data-track-meta');

      let meta = {};
      if (trackMeta) {
        try {
          meta = JSON.parse(trackMeta);
        } catch (err) {
          meta = { raw: trackMeta };
        }
      }

      // Add element info
      meta.element = target.tagName.toLowerCase();
      if (target.href) meta.href = target.href;
      if (target.id) meta.elementId = target.id;

      trackEvent({
        type: trackType === 'nav' ? EVENT_TYPES.NAV_CLICK :
              trackType === 'cta' ? EVENT_TYPES.CTA_CLICK :
              trackType === 'phone' ? EVENT_TYPES.PHONE_CLICK :
              trackType === 'email' ? EVENT_TYPES.EMAIL_CLICK :
              EVENT_TYPES.CLICK,
        label: trackLabel,
        meta
      });
    }, true);

    log('Click tracking initialized');
  }

  /**
   * Setup form tracking
   */
  function setupFormTracking() {
    if (!CONFIG.AUTO_TRACK_FORMS) return;

    document.addEventListener('submit', function(e) {
      const form = e.target;
      if (!form || form.tagName !== 'FORM') return;

      const formId = form.id || form.getAttribute('name') || 'unknown-form';
      
      trackFormSubmit(formId, {
        action: form.action || '',
        method: form.method || 'get'
      });
    }, true);

    log('Form tracking initialized');
  }

  /**
   * Setup phone link tracking
   */
  function setupPhoneTracking() {
    document.querySelectorAll('a[href^="tel:"]').forEach(link => {
      if (!link.hasAttribute('data-track')) {
        link.setAttribute('data-track', 'Phone Call');
        link.setAttribute('data-track-type', 'phone');
      }
    });

    document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
      if (!link.hasAttribute('data-track')) {
        link.setAttribute('data-track', 'Email Click');
        link.setAttribute('data-track-type', 'email');
      }
    });
  }

  // ============================================
  // GEO ENRICHMENT (Optional)
  // ============================================

  /**
   * Enrich visitor with geo data (disabled by default for privacy)
   * To enable: set CONFIG.ENABLE_GEO_ENRICHMENT = true
   */
  async function enrichWithGeo() {
    if (!CONFIG.ENABLE_GEO_ENRICHMENT) return;

    const visitorId = getVisitorId();
    const visitor = DataStore.getVisitor(visitorId);
    
    // Skip if already enriched
    if (visitor?.geo) return;

    try {
      const response = await fetch(CONFIG.GEO_API_URL);
      if (!response.ok) return;
      
      const geo = await response.json();
      
      visitor.geo = {
        country: geo.country_name || geo.country,
        region: geo.region,
        city: geo.city,
        timezone: geo.timezone
      };
      
      DataStore.saveVisitor(visitor);
      log('Geo enrichment complete:', visitor.geo);
    } catch (e) {
      log('Geo enrichment failed:', e);
    }
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  function init() {
    // Initialize visitor and session
    initVisitor();

    // Track page view
    trackPageView();

    // Setup auto-tracking
    setupClickTracking();
    setupFormTracking();
    setupPhoneTracking();

    // Optional geo enrichment
    if (CONFIG.ENABLE_GEO_ENRICHMENT) {
      enrichWithGeo();
    }

    log('Analytics initialized');
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ============================================
  // PUBLIC API
  // ============================================

  const Analytics = {
    // Configuration
    CONFIG,
    EVENT_TYPES,
    
    // Core functions
    getVisitorId,
    getSessionId,
    trackEvent,
    trackPageView,
    trackClick,
    trackCTA,
    trackNavClick,
    trackFormSubmit,
    trackQuiz,
    trackPlanSelect,
    
    // Utilities
    parseUserAgent,
    getUTMParams,
    
    // Re-initialize (useful for SPAs)
    init
  };

  // Expose to global scope
  global.Analytics = Analytics;

})(typeof window !== 'undefined' ? window : this);
