# Boss Booker

A modern, magenta-themed website for Boss Booker - Professional booking and scheduling services.

## Features

### Home Page
- Hero section with compelling copy
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
- Contact information display
- Contact email: bossbookerinfo@gmail.com
- Form submissions saved to admin portal

### Admin Portal (NEW!)
- Password-protected administrative interface
- Contact form submission management
- Service request tracking from plans page
- Client list with accept/acknowledge workflow
- CSV export functionality
- Content management interface
- See `ADMIN_SETUP.md` for setup instructions

## Design Features

### Magenta Theme
- Primary color: `#d946ef`
- Consistent gradient usage throughout
- Professional yet vibrant color palette
- High contrast for accessibility

### Mobile-First Design
- Fully responsive on all screen sizes
- Touch-friendly navigation
- Optimized layouts for mobile, tablet, and desktop
- Collapsible mobile menu

### Performance
- Vanilla JavaScript (no frameworks) for fast loading
- Optimized CSS with minimal dependencies
- Efficient DOM manipulation
- Lightweight codebase

### Accessibility
- Semantic HTML5
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus indicators
- Screen reader friendly
- Color contrast compliance

## File Structure

```
/
├── index.html          # Home page
├── plans.html          # Plans and pricing
├── about.html          # About us
├── faq.html            # FAQ page
├── referrals.html      # Referral program
├── contact.html        # Contact form
├── styles.css          # Main stylesheet
├── plans.css           # Plans page styles
├── faq.css             # FAQ page styles
├── contact.css         # Contact page styles
├── script.js           # Main JavaScript
├── plans.js            # Plans page logic
├── faq.js              # FAQ page logic
├── contact.js          # Contact page logic
└── README.md           # This file
```

## Local Development

1. Clone the repository
2. Open `index.html` in a web browser, or
3. Use a local server:
   ```bash
   python3 -m http.server 8080
   ```
4. Navigate to `http://localhost:8080`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Features Checklist

- [x] Magenta theme applied throughout
- [x] Navigation with all 6 sections (Home, Plans, About, FAQ, Referrals, Contact)
- [x] Hero section with CTA
- [x] Interactive quiz for plan recommendations
- [x] Trust bar with brand logos
- [x] 3-step explainer section
- [x] Testimonials showcase
- [x] Integrations display
- [x] Sticky CTA button
- [x] Plan comparison table
- [x] Customizable plan builder
- [x] Live pricing calculator
- [x] À la carte add-ons
- [x] About page with company info
- [x] FAQ with accordion
- [x] Referrals program page
- [x] Contact form
- [x] Mobile-first responsive design
- [x] Fast loading performance
- [x] Accessibility features

## Technologies Used

- HTML5
- CSS3 (with CSS Grid and Flexbox)
- Vanilla JavaScript (ES6+)
- No external dependencies or frameworks

## License

© 2025 Boss Booker. All rights reserved.