/**
 * Plans builder — Boss Booker
 * Fixes:
 *  - reliable update on select/checkbox/radio changes
 *  - removed bottom duplicate totals (only sidebar summary remains)
 *  - enterprise shows "Contact for pricing"
 *  - PPC Scale preserved as note (not added to numeric totals)
 *
 * Console.debug lines included to help verification.
 */

// Pricing and setup map (monthly, one-time setup)
const PLAN_PRICING = {
  nano:    { monthly: 599,  setup: 0 },
  micro:   { monthly: 799,  setup: 299 },
  starter: { monthly: 1899, setup: 0 },
  pro:     { monthly: 3799, setup: 0 },
  scale:   { monthly: 4199, setup: 1200 },
  enterprise: { monthly: 0, setup: 0, custom: true },
  smallbusiness: { monthly: 199, setup: 399 },
  glam_nano: { monthly: 149, setup: 79 },
  glam_micro: { monthly: 299, setup: 129 },
  glam_pro: { monthly: 599, setup: 179 }
};

// Feature labels (used in copyQuote)
const PLAN_FEATURES = {
  nano: [ "Core Automation Nano — missed-call text-back, 2-touch follow-ups, shared inbox, 1 pipeline", "Appointment Setting Nano — up to 60 attempts/mo" ],
  micro: [ "Core Automation Micro — 3-touch follow-ups, 2 pipelines", "Appointment Setting Micro — up to 120 attempts/mo" ],
  starter: [ "Core Automation Starter — advanced routing, UTM capture, 4 pipelines", "Appointment Setting Starter — up to 300 attempts/mo" ],
  pro: [ "Core Automation Pro — SLA monitoring, custom events", "Appointment Setting Pro — up to 1,200 attempts/mo" ],
  scale: [ "Core Automation Scale — priority support, advanced reporting", "Appointment Setting Pro — 1,200 attempts + 300 buffer" ],
  enterprise: [ "Custom SLAs, bespoke integrations", "Contact us for pricing" ],
  smallbusiness: [ "Small Business Starter Kit — included features (special)" ],
  glam_nano: [ "GLAM Nano — Link-in-bio booking hub, DM auto-replies" ],
  glam_micro: [ "GLAM Micro — Everything in Nano + 8 templated posts/mo" ],
  glam_pro: [ "GLAM Pro — 20 posts/mo, light clip trims, boosted-post advising" ]
};

// Utility: format currency (simple)
function fmt(v) {
  if (typeof v !== 'number') return v;
  return `$${v.toLocaleString()}`;
}

// Helper: read selected option data attribute safely
function getSelectedAddonData(selectEl) {
  if (!selectEl) return null;
  const idx = selectEl.selectedIndex;
  if (idx < 0) return null;
  const opt = selectEl.options[idx];
  if (!opt) return null;
  return {
    value: opt.value || '',
    price: opt.dataset.price !== undefined && opt.dataset.price !== '' ? parseFloat(opt.dataset.price || '0') : null,
    onetime: opt.dataset.onetime === 'true',
    pct: opt.dataset.pct ? parseFloat(opt.dataset.pct) : null,
    min: opt.dataset.min ? parseFloat(opt.dataset.min) : null,
    label: opt.textContent ? opt.textContent.trim() : opt.value
  };
}

function updatePrice() {
  const basePlanRadio = document.querySelector('input[name="basePlan"]:checked');
  const basePlanValue = basePlanRadio ? basePlanRadio.value : 'starter';
  const planData = PLAN_PRICING[basePlanValue] || { monthly: 0, setup: 0 };

  console.debug('[updatePrice] basePlan:', basePlanValue, planData);

  // Base monthly and base setup
  let monthlyTotal = Number(planData.monthly || 0);
  let onetimeTotal = Number(planData.setup || 0);

  // Read tiered add-ons (.addon-select)
  const addonSelects = Array.from(document.querySelectorAll('.addon-select'));
  let ppcScaleChosen = false;
  let ppcScaleNote = '';

  addonSelects.forEach(sel => {
    const info = getSelectedAddonData(sel);
    if (!info || !info.value) return;
    console.debug('[addon-select] selected:', sel.id, info);

    // PPC scale special handling (percent)
    if (info.pct) {
      ppcScaleChosen = true;
      const min = info.min || 0;
      ppcScaleNote = `PPC Scale selected: ${info.pct}% of ad spend (min ${fmt(min)}) — billed against ad spend.`;
      // do not add numeric value to totals
      return;
    }

    // Numeric price handling
    if (info.onetime) {
      onetimeTotal += (info.price || 0);
    } else {
      monthlyTotal += (info.price || 0);
    }
  });

  // Monthly checkbox add-ons (including GLAM add-ons)
  const checkboxMonthlyTotal = Array.from(document.querySelectorAll('.checkbox-group input[type="checkbox"]'))
    .filter(el => el.checked && el.dataset.onetime !== 'true')
    .map(el => {
      const p = parseFloat(el.dataset.price || "0");
      console.debug('[checkbox-monthly] ', el.value, p);
      return p;
    })
    .reduce((a, b) => a + b, 0);

  // One-time checkbox add-ons
  const checkboxOnetimeTotal = Array.from(document.querySelectorAll('.checkbox-group input[type="checkbox"]'))
    .filter(el => el.checked && el.dataset.onetime === 'true')
    .map(el => {
      const p = parseFloat(el.dataset.price || "0");
      console.debug('[checkbox-onetime] ', el.value, p);
      return p;
    })
    .reduce((a, b) => a + b, 0);

  // Add checkbox totals
  monthlyTotal += checkboxMonthlyTotal;
  onetimeTotal += checkboxOnetimeTotal;

  const firstMonthTotal = monthlyTotal + onetimeTotal;

  console.debug('[totals] monthly:', monthlyTotal, 'onetime:', onetimeTotal, 'first:', firstMonthTotal, 'ppcScaleChosen:', ppcScaleChosen);

  // Update sidebar summary
  const basePlanNameElem = document.getElementById('basePlanName');
  if (basePlanNameElem) {
    let prettyName = basePlanValue;
    if (basePlanValue === 'smallbusiness') prettyName = 'Small Business Starter Kit';
    else if (basePlanValue.startsWith('glam_')) prettyName = basePlanValue.replace('glam_', 'GLAM ').replace('_', ' ');
    else prettyName = basePlanValue.charAt(0).toUpperCase() + basePlanValue.slice(1);
    basePlanNameElem.textContent = prettyName;
  }

  // Sidebar numeric display (or contact)
  const monthlyElem = document.getElementById('monthlyTotal');
  const onetimeElem = document.getElementById('onetimeTotal');
  const firstElem = document.getElementById('firstMonthTotal');

  if (PLAN_PRICING[basePlanValue] && PLAN_PRICING[basePlanValue].custom) {
    if (monthlyElem) monthlyElem.textContent = 'Contact for pricing';
    if (onetimeElem) onetimeElem.textContent = 'Contact for pricing';
    if (firstElem) firstElem.textContent = 'Contact for pricing';
  } else {
    if (monthlyElem) monthlyElem.textContent = fmt(monthlyTotal);
    if (onetimeElem) onetimeElem.textContent = fmt(onetimeTotal);
    if (firstElem) firstElem.textContent = fmt(firstMonthTotal);
  }

  // Show/hide onetime row
  const onetimeRow = document.getElementById('onetimeRow');
  if (onetimeRow) onetimeRow.style.display = (onetimeTotal > 0 && !PLAN_PRICING[basePlanValue]?.custom) ? 'block' : 'none';

  // Save ppcScaleNote for copyQuote (hidden element)
  const ppcNoteEl = document.getElementById('ppcScaleNote');
  if (ppcNoteEl) {
    ppcNoteEl.textContent = ppcScaleChosen ? ppcScaleNote : '';
  }

  console.debug('[updatePrice:end] sidebar monthly:', monthlyElem?.textContent);
}

// copyQuote compiles selected plan, included features, tiered addons and checkboxes, and PPC Scale note if present
function copyQuote() {
  const basePlanRadio = document.querySelector('input[name="basePlan"]:checked');
  const basePlanValue = basePlanRadio ? basePlanRadio.value : 'starter';
  const planName = (document.getElementById('basePlanName')?.textContent) || basePlanValue;

  const monthly = document.getElementById('monthlyTotal')?.textContent || '';
  const onetime = document.getElementById('onetimeTotal')?.textContent || '';
  const first = document.getElementById('firstMonthTotal')?.textContent || '';

  const included = PLAN_FEATURES[basePlanValue] || [];

  // tiered add-ons chosen
  const addonSelects = Array.from(document.querySelectorAll('.addon-select'));
  const selectedTierAddons = [];
  addonSelects.forEach(sel => {
    const info = getSelectedAddonData(sel);
    if (!info || !info.value) return;
    if (info.pct) {
      selectedTierAddons.push(`${info.label} — ${info.pct}% of ad spend (min ${fmt(info.min)})`);
    } else {
      const priceStr = info.onetime ? fmt(info.price) + ' (one-time)' : fmt(info.price) + '/mo';
      selectedTierAddons.push(`${info.label} — ${priceStr}`);
    }
  });

  // checkbox add-ons selected
  const addons = Array.from(document.querySelectorAll('.checkbox-group input[type="checkbox"]'))
    .filter(el => el.checked)
    .map(el => {
      const price = el.dataset.price ? parseFloat(el.dataset.price) : 0;
      const onetime = el.dataset.onetime === 'true';
      return `${el.parentElement?.innerText.trim().replace(/\s+/g, ' ')} ${onetime ? '(one-time)' : ''} — ${fmt(price)}`;
    })
    .filter(Boolean);

  const payloadParts = [
    "Boss Booker — Quote",
    `Plan: ${planName}`,
    `Monthly: ${monthly}`,
    `One-time Setup Fee: ${onetime}`,
    `First Month Due: ${first}`,
    included.length ? `Included features:\n- ${included.join('\n- ')}` : "Included features: (none)"
  ];

  if (selectedTierAddons.length) payloadParts.push(`Tiered add-ons selected:\n- ${selectedTierAddons.join('\n- ')}`);
  if (addons.length) payloadParts.push(`Additional add-ons selected:\n- ${addons.join('\n- ')}`);

  const ppcNote = document.getElementById('ppcScaleNote')?.textContent;
  if (ppcNote) payloadParts.push(`Note: ${ppcNote}`);

  const payload = payloadParts.join("\n\n");

  navigator.clipboard.writeText(payload)
    .then(() => alert('Quote copied to clipboard'))
    .catch(() => alert('Could not copy — select & copy manually.'));
}

// Wire events: listen for any change and run updatePrice; also add direct listeners for inputs/selects
function wireEvents() {
  // simpler: any change on document triggers recalculation (select/checkbox/radio)
  document.addEventListener('change', () => {
    setTimeout(updatePrice, 0);
  });

  // direct listeners (for older browsers)
  const selects = Array.from(document.querySelectorAll('.addon-select'));
  selects.forEach(s => s.addEventListener('change', updatePrice));
  const checkboxes = Array.from(document.querySelectorAll('.checkbox-group input[type="checkbox"]'));
  checkboxes.forEach(c => c.addEventListener('change', updatePrice));
  const baseRadios = Array.from(document.querySelectorAll('input[name="basePlan"]'));
  baseRadios.forEach(r => r.addEventListener('change', updatePrice));
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  wireEvents();
  updatePrice();
  console.debug('[plans.js] initialized');
});
