/**
 * Contact Form Handler - Boss Booker
 * 
 * Handles contact form submission with:
 * - DataStore integration for lead capture
 * - Analytics tracking
 * - Worker API fallback
 */

(function() {
    'use strict';

    // Handle contact form submission
    async function handleContactSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn?.textContent || 'Send';
        
        // Show loading state
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
        }
        
        // Get form data
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            company: formData.get('company') || '',
            phone: formData.get('phone') || '',
            message: formData.get('message') || ''
        };
        
        let success = false;
        
        // 1. Try Cloudflare Worker API first (if configured)
        if (window.API_CONFIG && !window.API_CONFIG.USE_LOCALSTORAGE_FALLBACK) {
            try {
                const response = await fetch(`${window.API_CONFIG.WORKER_URL}${window.API_CONFIG.ENDPOINTS.CONTACT}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    success = true;
                }
            } catch (error) {
                console.warn('Worker API not available:', error);
            }
        }
        
        // 2. Save to DataStore (LocalStorage-backed)
        if (typeof DataStore !== 'undefined') {
            try {
                DataStore.saveLead({
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    company: data.company,
                    message: data.message,
                    source: 'contact_form',
                    page: window.location.pathname
                });
                success = true;
            } catch (error) {
                console.error('DataStore error:', error);
            }
        }
        
        // 3. Track analytics event
        if (typeof Analytics !== 'undefined') {
            Analytics.trackFormSubmit('contact_form', {
                hasPhone: !!data.phone,
                hasCompany: !!data.company,
                hasMessage: !!data.message
            });
            
            Analytics.trackEvent('lead_submit', {
                email: data.email,
                source: 'contact_form'
            });
        }
        
        // 3b. Submit to Portal Analytics
        if (typeof PortalAnalytics !== 'undefined') {
            try {
                await PortalAnalytics.submitLead({
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    company: data.company,
                    subject: 'Contact Form',
                    message: data.message,
                    source: 'contact_form'
                });
                success = true;
            } catch (error) {
                console.warn('Portal Analytics lead submission failed:', error);
            }
        }
        
        // 4. Fallback to direct localStorage
        if (!success) {
            try {
                const localData = {
                    id: 'contact_' + Date.now(),
                    ...data,
                    timestamp: Date.now(),
                    status: 'new'
                };
                const contacts = JSON.parse(localStorage.getItem('bossbooker_contacts') || '[]');
                contacts.unshift(localData);
                localStorage.setItem('bossbooker_contacts', JSON.stringify(contacts));
                success = true;
            } catch (error) {
                console.error('localStorage error:', error);
            }
        }
        
        // Reset button state
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
        
        // Show result
        if (success) {
            showSuccessMessage(form);
            form.reset();
        } else {
            showErrorMessage();
        }
    }
    
    // Show success message
    function showSuccessMessage(form) {
        // Check for existing success message
        let successEl = form.querySelector('.form-success');
        
        if (!successEl) {
            successEl = document.createElement('div');
            successEl.className = 'form-success';
            successEl.style.cssText = `
                background: rgba(74, 222, 128, 0.1);
                border: 1px solid rgba(74, 222, 128, 0.3);
                color: var(--success-color, #4ade80);
                padding: 16px;
                border-radius: 8px;
                margin-top: 16px;
                text-align: center;
            `;
            form.appendChild(successEl);
        }
        
        successEl.innerHTML = `
            <strong>Message sent!</strong><br>
            <span style="font-size: 14px; opacity: 0.9;">
                We'll get back to you within 1 business day.<br>
                Or call us now: <a href="tel:+16028422772" style="color: inherit; font-weight: 600;">(602) 842-2772</a>
            </span>
        `;
        successEl.style.display = 'block';
        
        // Hide after 10 seconds
        setTimeout(() => {
            successEl.style.display = 'none';
        }, 10000);
    }
    
    // Show error message
    function showErrorMessage() {
        alert('Sorry, there was an error submitting your message. Please try again or call us at (602) 842-2772.');
    }
    
    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        const contactForm = document.getElementById('contactForm');
        
        if (contactForm) {
            contactForm.addEventListener('submit', handleContactSubmit);
        }
        
        // Pre-fill from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const subject = urlParams.get('subject');
        const plan = urlParams.get('plan');
        
        if (subject) {
            const subjectSelect = document.getElementById('subject');
            if (subjectSelect) {
                const options = Array.from(subjectSelect.options);
                const match = options.find(opt => 
                    opt.textContent.toLowerCase().includes(subject.toLowerCase()) ||
                    opt.value.toLowerCase().includes(subject.toLowerCase())
                );
                if (match) subjectSelect.value = match.value;
            }
        }
        
        if (plan) {
            const messageField = document.getElementById('message');
            if (messageField && !messageField.value) {
                messageField.value = `I'm interested in the ${plan} plan.\n\n`;
                messageField.focus();
            }
        }
        
        // Track page view
        if (typeof Analytics !== 'undefined') {
            Analytics.trackPageView();
        }
    });

})();
