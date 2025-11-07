/**
 * Plans builder — Boss Booker
 * Keeps existing functionality; adds setup fees and updated prices.
 */

function updatePrice() {
    const SETUP_FEES = { starter: 499, growth: 999, scale: 2499 };

    // Base plan
    const basePlanRadio = document.querySelector('input[name="basePlan"]:checked');
    const basePlanPrice = basePlanRadio ? parseFloat(basePlanRadio.dataset.price || "0") : 0;

    // Monthly add-ons
    const addonChecks = Array.from(document.querySelectorAll('.checkbox-group input[type="checkbox"]'))
        .filter(el => !el.hasAttribute('data-onetime'));
    const addonsMonthly = addonChecks
        .filter(el => el.checked)
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
    const baseSetup = SETUP_FEES[basePlanRadio.value] || 0;
    const onetimeTotal = baseSetup + onetimeFromAddons;
    const firstMonthTotal = monthlyTotal + onetimeTotal;

    // Update labels
    if (document.getElementById('basePlanName')) {
        const planName = basePlanRadio ? (basePlanRadio.value.charAt(0).toUpperCase() + basePlanRadio.value.slice(1)) : 'Starter';
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
    const basePlanName = basePlanRadio ? (basePlanRadio.value.charAt(0).toUpperCase() + basePlanRadio.value.slice(1)) : 'Starter';

    const monthly = document.getElementById('monthlyTotal')?.textContent || '';
    const onetime = document.getElementById('onetimeTotal')?.textContent || '';
    const first = document.getElementById('firstMonthTotal')?.textContent || '';

    const addons = Array.from(document.querySelectorAll('.checkbox-group input[type="checkbox"]'))
        .filter(el => el.checked)
        .map(el => el.parentElement?.innerText.trim().replace(/\s+/g, ' ') || '')
        .filter(Boolean);

    const payload = [
        "Boss Booker — Quote",
        `Plan: ${basePlanName}`,
        `Monthly: ${monthly}`,
        `One-time: ${onetime}`,
        `First Month Due: ${first}`,
        addons.length ? `Add-ons:\n- ${addons.join('\n- ')}` : "Add-ons: (none)"
    ].join("\n");

    navigator.clipboard.writeText(payload)
        .then(() => alert('Quote copied to clipboard'))
        .catch(() => alert('Could not copy — select & copy manually.'));
}

// Initialize
document.addEventListener('DOMContentLoaded', updatePrice);
