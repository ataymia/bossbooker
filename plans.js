/**
 * Plans builder — Boss Booker
 * Keeps existing functionality; adds setup fees and updated prices.
 */

// Small Business Starter Kit included features (cannot be added separately when this plan is selected)
const SMALL_BUSINESS_INCLUDED = [
    'sms_assistant',     // SMS Assistant
    'analytics',         // Analytics Dashboard
    'appt50',            // Appointment Setting (starter level)
    'ppc_mgmt',          // Ads Mgmt (Starter)
];

function toggleSmallBusinessPlan() {
    const checkbox = document.getElementById('eligibilityCheckbox');
    const smallBusinessRadio = document.querySelector('input[name="basePlan"][value="smallbusiness"]');
    const smallBusinessOption = document.getElementById('smallBusinessOption');
    
    if (checkbox && smallBusinessRadio) {
        smallBusinessRadio.disabled = !checkbox.checked;
        
        // Visual feedback
        if (checkbox.checked) {
            smallBusinessOption.style.opacity = '1';
            smallBusinessOption.style.cursor = 'pointer';
        } else {
            smallBusinessOption.style.opacity = '0.5';
            smallBusinessOption.style.cursor = 'not-allowed';
            
            // If Small Business was selected, switch to Starter
            if (smallBusinessRadio.checked) {
                const starterRadio = document.querySelector('input[name="basePlan"][value="starter"]');
                if (starterRadio) {
                    starterRadio.checked = true;
                    updatePrice();
                }
            }
        }
    }
}

function updatePrice() {
    const SETUP_FEES = { 
        starter: 499, 
        growth: 999, 
        scale: 2499,
        smallbusiness: 399  // Small Business Starter Kit setup fee
    };

    // Base plan
    const basePlanRadio = document.querySelector('input[name="basePlan"]:checked');
    const basePlanValue = basePlanRadio ? basePlanRadio.value : 'starter';
    const basePlanPrice = basePlanRadio ? parseFloat(basePlanRadio.dataset.price || "0") : 0;
    
    // Check if Small Business Starter Kit is selected
    const isSmallBusiness = basePlanValue === 'smallbusiness';

    // Monthly add-ons
    const addonChecks = Array.from(document.querySelectorAll('.checkbox-group input[type="checkbox"]'))
        .filter(el => !el.hasAttribute('data-onetime') && el.id !== 'eligibilityCheckbox');
    
    // Disable/hide included add-ons when Small Business is selected
    addonChecks.forEach(checkbox => {
        const isIncluded = SMALL_BUSINESS_INCLUDED.includes(checkbox.value);
        const label = checkbox.parentElement;
        
        if (isSmallBusiness && isIncluded) {
            checkbox.disabled = true;
            checkbox.checked = false;
            label.style.opacity = '0.5';
            label.style.cursor = 'not-allowed';
            
            // Add visual indicator
            if (!label.querySelector('.included-badge')) {
                const badge = document.createElement('span');
                badge.className = 'included-badge';
                badge.textContent = ' (Included in Small Business Kit)';
                badge.style.color = 'var(--success-color)';
                badge.style.fontSize = '12px';
                badge.style.fontWeight = 'bold';
                label.querySelector('span').appendChild(badge);
            }
        } else {
            checkbox.disabled = false;
            label.style.opacity = '1';
            label.style.cursor = 'pointer';
            
            // Remove visual indicator
            const badge = label.querySelector('.included-badge');
            if (badge) badge.remove();
        }
    });
    
    const addonsMonthly = addonChecks
        .filter(el => el.checked && !el.disabled)
        .map(el => parseFloat(el.dataset.price || "0"))
        .reduce((a, b) => a + b, 0);

    // One-time items
    const onetimeChecks = Array.from(document.querySelectorAll('.checkbox-group input[type="checkbox"][data-onetime="true"]'));
    const onetimeFees = onetimeChecks
        .filter(el => el.checked)
        .map(el => parseFloat(el.dataset.price || "0"));

    // Additional users (if present in DOM, keep backward compatibility)
    const additionalUsersInput = document.getElementById('additionalUsers');
    const additionalUserPrice = additionalUsersInput ? parseFloat(additionalUsersInput.dataset.price || "0") : 0;
    const additionalUsers = additionalUsersInput ? parseInt(additionalUsersInput.value || "0", 10) : 0;

    // Totals
    const monthlyTotal = basePlanPrice + addonsMonthly + (additionalUsers * additionalUserPrice);
    const onetimeFromAddons = onetimeFees.reduce((a, b) => a + b, 0);
    const baseSetup = SETUP_FEES[basePlanValue] || 0;
    const onetimeTotal = baseSetup + onetimeFromAddons;
    const firstMonthTotal = monthlyTotal + onetimeTotal;

    // Update labels
    if (document.getElementById('basePlanName')) {
        let planName = 'Starter';
        if (basePlanValue === 'smallbusiness') {
            planName = 'Small Business Starter Kit';
        } else if (basePlanRadio) {
            planName = basePlanRadio.value.charAt(0).toUpperCase() + basePlanRadio.value.slice(1);
        }
        document.getElementById('basePlanName').textContent = planName;
    }
    if (document.getElementById('monthlyTotal')) document.getElementById('monthlyTotal').textContent = `$${monthlyTotal.toLocaleString()}`;
    if (document.getElementById('onetimeTotal')) document.getElementById('onetimeTotal').textContent = `$${onetimeTotal.toLocaleString()}`;
    if (document.getElementById('firstMonthTotal')) document.getElementById('firstMonthTotal').textContent = `$${firstMonthTotal.toLocaleString()}`;

    // Optional visibility row if your HTML uses it (kept from original pattern)
    const onetimeRow = document.getElementById('onetimeRow');
    if (onetimeRow) onetimeRow.style.display = onetimeTotal > 0 ? 'block' : 'none';
}

function copyQuote() {
    // Gather state
    const basePlanRadio = document.querySelector('input[name="basePlan"]:checked');
    const basePlanValue = basePlanRadio ? basePlanRadio.value : 'starter';
    let basePlanName = 'Starter';
    
    if (basePlanValue === 'smallbusiness') {
        basePlanName = 'Small Business Starter Kit';
    } else if (basePlanRadio) {
        basePlanName = basePlanRadio.value.charAt(0).toUpperCase() + basePlanRadio.value.slice(1);
    }

    const monthly = document.getElementById('monthlyTotal')?.textContent || '';
    const onetime = document.getElementById('onetimeTotal')?.textContent || '';
    const first = document.getElementById('firstMonthTotal')?.textContent || '';

    const addons = Array.from(document.querySelectorAll('.checkbox-group input[type="checkbox"]'))
        .filter(el => el.checked && !el.disabled && el.id !== 'eligibilityCheckbox')
        .map(el => el.parentElement?.innerText.trim().replace(/\s+/g, ' ').replace(/\(Included in Small Business Kit\)/g, '').trim() || '')
        .filter(Boolean);
    
    // Add included features for Small Business Starter Kit
    let includedFeatures = '';
    if (basePlanValue === 'smallbusiness') {
        includedFeatures = '\n\nIncluded Features:\n- 1 custom web page\n- Initial setup/onboarding\n- Starter ads (Google/Meta)\n- Starter CRM\n- Appointment booking\n- Automation pack\n- SMS assistant\n- Analytics dashboard\n- Onboarding support';
    }

    const payload = [
        "Boss Booker — Quote",
        `Plan: ${basePlanName}`,
        `Monthly: ${monthly}`,
        `One-time Setup Fee: ${onetime}`,
        `First Month Due: ${first}`,
        addons.length ? `Add-ons:\n- ${addons.join('\n- ')}` : "Add-ons: (none)",
        includedFeatures
    ].filter(Boolean).join("\n");

    navigator.clipboard.writeText(payload)
        .then(() => alert('Quote copied to clipboard'))
        .catch(() => alert('Could not copy — select & copy manually.'));
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    toggleSmallBusinessPlan();
    updatePrice();
});
