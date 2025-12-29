# Boss Booker

A modern, magenta-themed website for Boss Booker - Professional booking and scheduling services.

## 📞 Contact

**Phone:** (602) 842-2772  
**Email:** bossbookerinfo@gmail.com

---

## Features

### Home Page
- Hero section with compelling copy and animated gradient background
- Interactive "Get Started" quiz that recommends the perfect plan
- Trust bar showcasing credibility
- 3-step explainer of how the service works
- Customer testimonials
- Integration showcase
- Sticky CTA button for conversions

### Plans Page
- Package comparison with 4 pricing tiers (Starter, Professional, Business, Enterprise)
- Interactive plan builder with live pricing calculator
- À la carte add-ons and services
- One-time fee support
- Additional user pricing
- Service request form with DataStore integration
- FAQ section specific to plans

### About Page
- Company mission and story
- Core values display
- Leadership team section
- Statistics showcase
- Call-to-action section

### FAQ Page
- Accordion-style Q&A organized by categories
- Categories: General, Pricing & Plans, Features, Technical, Support
- Interactive category filtering

### Referrals Page
- Referral program explanation
- Reward benefits display
- Referral link generator
- Success statistics
- Program FAQ

### Contact Page
- Multi-field contact form with validation
- Direct phone: (602) 842-2772
- Email: bossbookerinfo@gmail.com
- Form submissions saved via DataStore
- Analytics tracking on form submit

### Admin Portal (/admin.html)
- **Password:** `neversleep` (case-insensitive)
- Lockout after 5 failed attempts (15 min)
- Dashboard with stats overview (visitors, sessions, page views, conversions)
- Top pages chart and referrer breakdown
- Recent activity feed
- **Tabs:**
  - Dashboard - Overview stats and charts
  - Visitors - Unique visitor list
  - Events - All tracked events (page views, clicks, form submits)
  - Leads - Contact form submissions with status management
  - Plan Requests - Service request tracking
  - Exports - Download data as JSON/CSV
  - Settings - Storage info and danger zone

---

## New Modules (v2.0)

### DataStore (`datastore.js`)
Firebase-ready data layer with LocalStorage backend.

**Functions:**
- `saveLead(data)` - Save contact form submission
- `listLeads()` - Get all leads
- `updateLead(id, updates)` - Update lead status/notes
- `savePlanRequest(data)` - Save plan request
- `listPlanRequests()` - Get all plan requests
- `updatePlanRequest(id, updates)` - Update request status
- `logEvent(type, data)` - Log analytics event
- `listEvents()` - Get events (newest first)
- `listVisitors()` - Get unique visitors
- `getDashboardStats()` - Aggregated dashboard stats
- `exportAllData()` - Full data export
- `exportToCSV(type)` - Export as CSV
- `clearAllData()` - Wipe all data

**Storage Keys:**
- `bb_visitors` - Visitor data
- `bb_events` - Event log (max 5000)
- `bb_leads` - Contact form leads
- `bb_plan_requests` - Plan/service requests

### Analytics (`analytics.js`)
Lightweight visitor and event tracking.

**Functions:**
- `trackPageView()` - Auto-called on page load
- `trackEvent(type, data)` - Custom event
- `trackClick(element, data)` - Click tracking
- `trackCTA(ctaName, data)` - CTA button clicks
- `trackNavClick(page)` - Navigation clicks
- `trackFormSubmit(formName, data)` - Form submissions
- `trackQuiz(action, data)` - Quiz interactions

**Auto-tracking:**
Elements with `data-track` attribute are automatically tracked on click.

---

## Design System

### Colors (CSS Variables)
```css
--primary-color: #ff2ebe;      /* Hot magenta */
--secondary-color: #8b5dff;    /* Purple */
--accent-color: #46efff;       /* Cyan */
--success-color: #4ade80;      /* Green */
--warning-color: #f59e0b;      /* Amber */
--error-color: #ef4444;        /* Red */
```

### Gradients
```css
--gradient-primary: linear-gradient(135deg, #ff2ebe 0%, #8b5dff 100%);
--gradient-hero: animated radial gradients
```

### Typography Scale
```css
--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;
--text-3xl: 1.875rem;
--text-4xl: 2.5rem;
```

### Spacing Scale
```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;
--space-3xl: 64px;
```

---

## File Structure

```
/
├── index.html          # Home page
├── plans.html          # Plans and pricing
├── about.html          # About us
├── faq.html            # FAQ page
├── referrals.html      # Referral program
├── contact.html        # Contact form
├── admin.html          # Admin portal (password: neversleep)
├── styles.css          # Main stylesheet (design system)
├── admin.css           # Admin portal styles
├── plans.css           # Plans page styles
├── faq.css             # FAQ page styles
├── contact.css         # Contact page styles
├── script.js           # Main JavaScript
├── plans.js            # Plans page logic
├── faq.js              # FAQ page logic
├── contact.js          # Contact form handler
├── admin.js            # Admin portal logic
├── datastore.js        # Data layer module
├── analytics.js        # Analytics module
├── api-config.js       # API configuration
└── README.md           # This file
```

---

## Local Development

1. Clone the repository
2. Open `index.html` in a web browser, or
3. Use a local server:
   ```bash
   python3 -m http.server 8080
   ```
4. Navigate to `http://localhost:8080`
5. Access admin at `http://localhost:8080/admin.html`

---

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Features Checklist

### Core Features
- [x] Magenta theme applied throughout
- [x] Navigation with all 6 sections
- [x] Hero section with animated gradient
- [x] Interactive quiz for plan recommendations
- [x] Trust bar with brand logos
- [x] 3-step explainer section
- [x] Testimonials showcase
- [x] Integrations display
- [x] Sticky CTA button
- [x] Plan comparison table
- [x] Customizable plan builder
- [x] Live pricing calculator
- [x] Contact form with validation

### Admin & Analytics (v2.0)
- [x] Admin portal with password protection
- [x] Dashboard with stats overview
- [x] Lead management with status tracking
- [x] Plan request tracking
- [x] Event logging
- [x] Visitor tracking
- [x] Data export (JSON/CSV)
- [x] DataStore module (Firebase-ready)
- [x] Analytics module

### Design (v2.0)
- [x] CSS variables design system
- [x] Rich gradients
- [x] Motion effects (respects prefers-reduced-motion)
- [x] Phone number in all footers
- [x] Glass morphism effects
- [x] Status indicators

---

## Technologies Used

- HTML5
- CSS3 (with CSS Grid, Flexbox, CSS Variables)
- Vanilla JavaScript (ES6+)
- LocalStorage for data persistence
- SessionStorage for admin auth
- No external dependencies or frameworks

---

## License

© 2025 Boss Booker. All rights reserved.
