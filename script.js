/**
 * Boss Booker - Global Script
 * Handles: sticky CTA, analytics wiring, smooth scroll
 * Quiz logic is now handled inline in index.html
 */

// ============================================
// MOBILE MENU TOGGLE
// ============================================
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navMenu = document.getElementById('navMenu');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
        });
    });
}

// ============================================
// STICKY CTA
// ============================================
const stickyCta = document.getElementById('stickyCta');

if (stickyCta) {
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 500) {
            stickyCta.classList.add('visible');
        } else {
            stickyCta.classList.remove('visible');
        }
    });
}

// ============================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href.length > 1) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                try {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                } catch (error) {
                    target.scrollIntoView();
                }
            }
        }
    });
});

// ============================================
// ANALYTICS INTEGRATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Track page view
    if (typeof Analytics !== 'undefined') {
        Analytics.trackPageView();
    }
    
    // Track CTA clicks
    document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => {
        btn.addEventListener('click', function() {
            if (typeof Analytics !== 'undefined') {
                const label = this.textContent?.trim() || 'button';
                Analytics.trackCTA(label, {
                    page: window.location.pathname,
                    href: this.href || null
                });
            }
        });
    });
});
