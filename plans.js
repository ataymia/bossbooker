/**
 * Plans builder — Boss Booker
 * Keeps existing functionality; adds setup fees and updated prices.
 */

// Small Business Starter Kit features for quote and display
const SMALLBUSINESS_FEATURES = [
    'sms_assistant', // SMS Assistant
    'analytics',     // Analytics Dashboard
    'appt50',        // Appointment Setting (starter level)
    'ppc_mgmt'       // Starter ads management
];

// Update pricing and plan switching
function updatePrice() {
    const SETUP_FEES = { starter: 499, growth: 999, scale: 2499, smallbusiness: 399 };

    // Base plan
    const basePlanRadio = document.querySelector('input[name="basePlan"]:checked');
    const basePlanValue = basePlanRadio ? basePlanRadio.value : 'starter';
    const basePlanPrice = basePlanRadio ? parseFloat(basePlanRadio.dataset.price || "0") : 0;

    // Monthly add-ons
    let addonsMonthly = 0;
    if (basePlanValue === 'smallbusiness') {
        // Small Business: no extra add-ons needed; included in bundle
        addonsMonthly = 0;
    } else {
        const addonChecks = Array.from(document.querySelectorAll('.checkbox-group input[type="checkbox"]'))
            .filter(el => !el.hasAttribute('data-onetime'));
        addonsMonthly = addonChecks
            .filter(el => el.checked)
            .map(el => parseFloat(el.dataset.price || "0"))
            .reduce((a, b) => a + b, 0);
    }

    // One-time items
    // For smallbusiness, setup fee is fixed, no extra a la carte
    let onetimeTotal = SETUP_FEES[basePlanValue] || 0;

    if (basePlanValue !== 'smallbusiness') {
        const onetimeChecks = Array.from(document.querySelectorAll('.checkbox-group input[type="checkbox"][data-onetime="true"]'));
        const onetimeFees = onetimeChecks
            .filter(el => el.checked)
            .map(el => parseFloat(el.dataset.price || "0"));
        onetimeTotal += onetimeFees.reduce((a, b) => a + b, 0);
    }

    const monthlyTotal = basePlanPrice + addonsMonthly;
    const firstMonthTotal = monthlyTotal + onetimeTotal;

    // Update labels
    if (document.getElementById('basePlanName')) {
        let planName = 'Starter';
        if (basePlanValue === 'smallbusiness') planName = 'Small Business Starter Kit';
        else if (basePlanRadio) planName = basePlanRadio.value.charAt(0).toUpperCase() + basePlanRadio.value.slice(1);
        document.getElementById('basePlanName').textContent = planName;
    }
    if (document.getElementById('monthlyTotal')) document.getElementById('monthlyTotal').textContent = `$${monthlyTotal.toLocaleString()}`;
    if (document.getElementById('onetimeTotal')) document.getElementById('onetimeTotal').textContent = `$${onetimeTotal.toLocaleString()}`;
    if (document.getElementById('firstMonthTotal')) document.getElementById('firstMonthTotal').textContent = `$${firstMonthTotal.toLocaleString()}`;
}

// Ensure quotes display correct included features for the Small Business plan
function copyQuote() {
    const basePlanRadio = document.querySelector('input[name="basePlan"]:checked');
    const basePlanValue = basePlanRadio ? basePlanRadio.value : 'starter';
    let planName = 'Starter';
    if (basePlanValue === 'smallbusiness') planName = 'Small Business Starter Kit';
    else if (basePlanRadio) planName = basePlanRadio.value.charAt(0).toUpperCase() + basePlanRadio.value.slice(1);

    const monthly = document.getElementById('monthlyTotal')?.textContent || '';
    const onetime = document.getElementById('onetimeTotal')?.textContent || '';
    const first = document.getElementById('firstMonthTotal')?.textContent || '';

    let addons = [];
    if (basePlanValue === 'smallbusiness') {
        addons = [
            "Included Features:",
            "- 1 custom web page",
            "- Initial setup/onboarding",
            "- Starter ads (Google/Meta)",
            "- CRM (starter)",
            "- Appointment booking",
            "- Automation pack",
            "- SMS assistant",
            "- Analytics dashboard",
            "- Onboarding support"
        ];
    } else {
        addons = Array.from(document.querySelectorAll('.checkbox-group input[type="checkbox"]'))
            .filter(el => el.checked)
            .map(el => el.parentElement?.innerText.trim().replace(/\s+/g, ' ') || '')
            .filter(Boolean);
    }

    const payload = [
        "Boss Booker — Quote",
        `Plan: ${planName}`,
        `Monthly: ${monthly}`,
        `One-time Setup Fee: ${onetime}`,
        `First Month Due: ${first}`,
        addons.length ? `${addons.join('\n')}` : "Add-ons: (none)"
    ].join("\n");

    navigator.clipboard.writeText(payload)
        .then(() => alert('Quote copied to clipboard'))
        .catch(() => alert('Could not copy — select & copy manually.'));
}

// Initialize
document.addEventListener('DOMContentLoaded', updatePrice);
