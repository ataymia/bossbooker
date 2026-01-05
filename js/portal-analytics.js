// Portal Analytics - Syncs data to Boss Booker Portal
// Add to main bossbooker.com site

const PortalAnalytics = (function() {
    const API_BASE = 'https://portal.bossbooker.com/api'; // Update with your actual portal URL
    const API_KEY = 'bb_sk_a7f2e9d8c5b3a1e4f6d2c8b9a3e5f1d9';
    
    // Generate or retrieve visitor ID
    function getVisitorId() {
        let visitorId = localStorage.getItem('bb_visitor_id');
        if (!visitorId) {
            visitorId = 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('bb_visitor_id', visitorId);
        }
        return visitorId;
    }
    
    // Generate session ID (expires on tab close)
    function getSessionId() {
        let sessionId = sessionStorage.getItem('bb_session_id');
        if (!sessionId) {
            sessionId = 's_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('bb_session_id', sessionId);
        }
        return sessionId;
    }
    
    // Detect device type
    function getDeviceType() {
        const ua = navigator.userAgent;
        if (/tablet|ipad|playbook|silk/i.test(ua)) return 'Tablet';
        if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'Mobile';
        return 'Desktop';
    }
    
    // Track visitor
    async function trackVisitor() {
        try {
            await fetch(`${API_BASE}/site/visitor`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': API_KEY
                },
                body: JSON.stringify({
                    visitorId: getVisitorId(),
                    sessionId: getSessionId(),
                    referrer: document.referrer || 'Direct',
                    userAgent: navigator.userAgent,
                    device: getDeviceType()
                })
            });
        } catch (e) {
            console.warn('Analytics: visitor tracking failed', e);
        }
    }
    
    // Track event
    async function trackEvent(type, label, data = {}) {
        try {
            await fetch(`${API_BASE}/site/event`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': API_KEY
                },
                body: JSON.stringify({
                    type,
                    label,
                    page: window.location.pathname,
                    visitorId: getVisitorId(),
                    sessionId: getSessionId(),
                    data
                })
            });
        } catch (e) {
            console.warn('Analytics: event tracking failed', e);
        }
    }
    
    // Track page view
    function trackPageView() {
        trackEvent('page_view', document.title, {
            url: window.location.href,
            referrer: document.referrer
        });
    }
    
    // Submit contact form lead
    async function submitLead(formData) {
        try {
            const response = await fetch(`${API_BASE}/site/lead`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    visitorId: getVisitorId(),
                    referrer: document.referrer,
                    page: window.location.pathname
                })
            });
            return await response.json();
        } catch (e) {
            console.error('Analytics: lead submission failed', e);
            throw e;
        }
    }
    
    // Submit plan request
    async function submitPlanRequest(requestData) {
        try {
            const response = await fetch(`${API_BASE}/site/plan-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...requestData,
                    visitorId: getVisitorId()
                })
            });
            return await response.json();
        } catch (e) {
            console.error('Analytics: plan request failed', e);
            throw e;
        }
    }
    
    // Get pricing from portal
    async function getPricing() {
        try {
            const response = await fetch(`${API_BASE}/site/pricing`);
            return await response.json();
        } catch (e) {
            console.error('Analytics: get pricing failed', e);
            return null;
        }
    }
    
    // Initialize on page load
    function init() {
        trackVisitor();
        trackPageView();
        
        // Track CTA clicks
        document.addEventListener('click', (e) => {
            const cta = e.target.closest('[data-track-cta]');
            if (cta) {
                trackEvent('cta_click', cta.dataset.trackCta, {
                    element: cta.tagName,
                    text: cta.textContent?.trim().substring(0, 50)
                });
            }
        });
    }
    
    // Auto-init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Public API
    return {
        trackEvent,
        trackPageView,
        submitLead,
        submitPlanRequest,
        getPricing,
        getVisitorId,
        getSessionId
    };
})();

// Make available globally
window.PortalAnalytics = PortalAnalytics;
