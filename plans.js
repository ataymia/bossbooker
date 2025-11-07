/**
 * Plans builder — Boss Booker
 * Updated to support tiered add-ons and selectable GLAM add-ons.
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

// Human-readable features per plan (used in copyQuote and summary messaging)
const PLAN_FEATURES = {
  nano: [
    "Core Automation Nano — missed-call text-back, 2-touch follow-ups, shared inbox, 1 pipeline",
    "Appointment Setting Nano — up to 60 attempts/mo (stop on reply/book)",
    "Pick ONE channel: PPC Nano (≤$1k ad spend) or SEO Nano",
    "Monthly check-in (15 min)"
  ],
  micro: [
    "Core Automation Micro — 3-touch follow-ups, 2 pipelines, basic dashboard",
    "Appointment Setting Micro — up to 120 attempts/mo",
    "Pick ONE channel: PPC Micro (≤$2.5k) or SEO Micro",
    "Monthly tune-up call (30 min)"
  ],
  starter: [
    "Core Automation Starter — advanced routing, UTM capture, 4 pipelines",
    "Appointment Setting Starter — up to 300 attempts/mo",
    "PPC Starter (≤$3k) AND SEO Micro",
    "Monthly strategy call (45 min)",
    "Site perk: 50% off a Landing Page build (order within 30 days)"
  ],
  pro: [
    "Core Automation Pro — SLA monitoring, custom events, bi-weekly reviews",
    "Appointment Setting Pro — up to 1,200 attempts/mo",
    "PPC Pro ($3k–$10k spend) AND SEO Pro",
    "Quarterly roadmap + experiments",
    "Site perk: Landing Page included (1x per year)"
  ],
  scale: [
    "Core Automation Scale — priority support, advanced reporting",
    "Appointment Setting Pro — 1,200 attempts + 300 rollover buffer included",
    "PPC Pro ($3k–$10k) AND SEO Pro (option to upgrade to Scale)",
    "Multi-location dashboards + quarterly executive review",
    "Site perk: Mini-site (3–5p) 50% off or $1,200 credit"
  ],
  enterprise: [
    "Custom SLAs, bespoke integrations, multi-brand governance",
    "Custom pricing & engagements — contact us to discuss",
    "Site credit: Full site (6–10p) 50% off or equivalent credit"
  ],
  smallbusiness: [
    "Small Business Starter Kit — 1 custom web page",
    "Initial setup & onboarding",
    "Starter Advertising (Google/Meta) — managed basics",
    "Starter CRM setup (lead pipeline)",
    "Appointment booking integration",
    "Automation pack (lead follow-up/reminder)",
    "SMS assistant included",
    "Basic analytics dashboard",
    "1-on-1 onboarding support"
  ],
  glam_nano: [
    "GLAM Nano — Link-in-bio booking hub, DM auto-replies, reminders",
    "2 templated posts/mo",
    "Review requests, policy page"
  ],
  glam_micro: [
    "Everything in GLAM Nano",
    "8 templated posts/mo, story calendar",
    "Waitlist & slot-drop SMS, highlight covers"
  ],
  glam_pro: [
    "Everything in GLAM Micro",
    "20 posts/mo, 2 light clip trims/mo",
    "Boosted-post advising (up to $150), Appointment Setting Nano (60 attempts)"
  ]
};

// Utility: format currency (simple)
function fmt(v) {
  if (typeof v !== 'number') return v;
  return `$${v.toLocaleString()}`;
}

// Helper: read selected option data attribute safely
function getSelectedAddonData(selectEl) {
  if (!selectEl) return null;
  const opt = selectEl.options[selectEl.selectedIndex];
  if (!opt || !opt.dataset) return null;
  return {
    value: opt.value || '',
    price: opt.dataset.price !== undefined ? parseFloat(opt.dataset.price || '0') : null,
    onetime: opt.dataset.onetime === 'true',
    pct: opt.dataset.pct ? parseFloat(opt.dataset.pct) : null,
    min: opt.dataset.min ? parseFloat(opt.dataset.min) : null,
    label: opt.textContent || opt.innerText || opt.value
  };
}

function updatePrice() {
  console.debug('updatePrice called');
  const basePlanRadio = document.querySelector('input[name="basePlan"]:checked');
  const basePlanValue = basePlanRadio ? basePlanRadio.value : 'starter';
  const planData = PLAN_PRICING[basePlanValue] || { monthly: 0, setup: 0 };
  console.debug('Base plan selected:', basePlanValue, 'data:', planData);

  // Base monthly and base setup
  let monthlyTotal = planData.monthly || 0;
  let onetimeTotal = planData.setup || 0;

  // Tiered add-ons (.addon-select)
  const addonSelects = Array.from(document.querySelectorAll('.addon-select'));
  let ppcScaleChosen = false;
  let ppcScaleNote = '';
  console.debug('Processing', addonSelects.length, 'addon-select elements');
  addonSelects.forEach(sel => {
    const info = getSelectedAddonData(sel);
    if (!info || !info.value) return;
    console.debug('Addon selected:', sel.id, 'value:', info.value, 'price:', info.price, 'onetime:', info.onetime, 'pct:', info.pct);
    // PPC scale special handling (percent)
    if (info.pct) {
      ppcScaleChosen = true;
      const min = info.min || 0;
      ppcScaleNote = `PPC Scale selected: ${info.pct}% of ad spend (min ${fmt(min)}) — billed against ad spend.`;
      console.debug('PPC Scale selected - NOT adding to numeric totals:', ppcScaleNote);
      // do not add numeric amount to totals
      return;
    }
    // Numeric price handling
    if (info.onetime) {
      onetimeTotal += (info.price || 0);
    } else {
      monthlyTotal += (info.price || 0);
    }
  });

  // Monthly checkbox add-ons
  const checkboxMonthly = Array.from(document.querySelectorAll('.checkbox-group input[type="checkbox"]'))
    .filter(el => !el.hasAttribute('data-onetime') && el.checked)
    .map(el => parseFloat(el.dataset.price || "0"))
    .reduce((a, b) => a + b, 0);

  // One-time checkbox add-ons
  const checkboxOnetime = Array.from(document.querySelectorAll('.checkbox-group input[type="checkbox"][data-onetime="true"]'))
    .filter(el => el.checked)
    .map(el => parseFloat(el.dataset.price || "0"))
    .reduce((a, b) => a + b, 0);

  console.debug('Checkbox add-ons - monthly:', checkboxMonthly, 'onetime:', checkboxOnetime);

  // Add these to totals
  monthlyTotal += checkboxMonthly;
  onetimeTotal += checkboxOnetime;

  const firstMonthTotal = monthlyTotal + onetimeTotal;
  console.debug('Final totals - monthly:', monthlyTotal, 'onetime:', onetimeTotal, 'first month:', firstMonthTotal);

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

  // Bottom totals bar update
  const bottomPlanName = document.getElementById('bottomPlanName');
  const bottomIncluded = document.getElementById('bottomIncluded');
  const bottomMonthly = document.getElementById('bottomMonthly');
  const bottomOnetime = document.getElementById('bottomOnetime');
  const bottomFirst = document.getElementById('bottomFirst');

  if (bottomPlanName) bottomPlanName.textContent = basePlanNameElem ? basePlanNameElem.textContent : basePlanValue;
  const includedFeatures = PLAN_FEATURES[basePlanValue] || [];
  if (bottomIncluded) bottomIncluded.textContent = includedFeatures.length ? includedFeatures.slice(0,2).join(' • ') : 'Includes core features';

  if (PLAN_PRICING[basePlanValue] && PLAN_PRICING[basePlanValue].custom) {
    if (bottomMonthly) bottomMonthly.textContent = 'Contact for pricing';
    if (bottomOnetime) bottomOnetime.textContent = 'Contact for pricing';
    if (bottomFirst) bottomFirst.textContent = 'Contact for pricing';
  } else {
    if (bottomMonthly) bottomMonthly.textContent = fmt(monthlyTotal);
    if (bottomOnetime) bottomOnetime.textContent = fmt(onetimeTotal);
    if (bottomFirst) bottomFirst.textContent = fmt(firstMonthTotal);
  }

  // save ppcScaleNote to a DOM element for copyQuote (if needed)
  const ppcNoteEl = document.getElementById('ppcScaleNote');
  if (ppcNoteEl) {
    ppcNoteEl.textContent = ppcScaleChosen ? ppcScaleNote : '';
  } else if (ppcScaleChosen) {
    // create a small invisible element to carry the note
    const el = document.createElement('div');
    el.id = 'ppcScaleNote';
    el.style.display = 'none';
    el.textContent = ppcScaleNote;
    document.body.appendChild(el);
  }
}

function copyQuote() {
  const basePlanRadio = document.querySelector('input[name="basePlan"]:checked');
  const basePlanValue = basePlanRadio ? basePlanRadio.value : 'starter';
  const planName = (document.getElementById('basePlanName')?.textContent) || basePlanValue;

  const monthly = document.getElementById('monthlyTotal')?.textContent || '';
  const onetime = document.getElementById('onetimeTotal')?.textContent || '';
  const first = document.getElementById('firstMonthTotal')?.textContent || '';

  // included features for the chosen plan
  const included = PLAN_FEATURES[basePlanValue] || [];

  // tiered add-ons chosen
  const addonSelects = Array.from(document.querySelectorAll('.addon-select'));
  const selectedTierAddons = [];
  addonSelects.forEach(sel => {
    const info = getSelectedAddonData(sel);
    if (!info || !info.value) return;
    // handle PPC scale note specially
    if (info.pct) {
      selectedTierAddons.push(`${info.label} — ${info.pct}% of ad spend (min ${fmt(info.min)})`);
    } else {
      const priceStr = info.onetime ? fmt(info.price) + ' (one-time)' : fmt(info.price) + '/mo';
      selectedTierAddons.push(`${info.label} — ${priceStr}`);
    }
  });

  // optional add-ons selected (checkboxes)
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

// Wire change events for selects and checkboxes so updatePrice runs instantly
document.addEventListener('DOMContentLoaded', () => {
  console.debug('DOMContentLoaded - initializing event listeners');
  // initial calc
  updatePrice();

  // Direct listeners for existing controls (for safety)
  // selects
  const selects = Array.from(document.querySelectorAll('.addon-select'));
  selects.forEach(s => s.addEventListener('change', updatePrice));

  // checkboxes
  const checkboxes = Array.from(document.querySelectorAll('.checkbox-group input[type="checkbox"]'));
  checkboxes.forEach(c => c.addEventListener('change', updatePrice));

  // base plan radios
  const baseRadios = Array.from(document.querySelectorAll('input[name="basePlan"]'));
  baseRadios.forEach(r => r.addEventListener('change', updatePrice));
  
  console.debug('Direct listeners attached to', selects.length, 'selects,', checkboxes.length, 'checkboxes,', baseRadios.length, 'radios');
});

// Event delegation on document for dynamic updates (belt and suspenders approach)
document.addEventListener('change', (e) => {
  // Check if the changed element is one of our pricing controls
  if (e.target.matches('.addon-select') || 
      e.target.matches('input[name="basePlan"]') || 
      e.target.matches('.checkbox-group input[type="checkbox"]')) {
    console.debug('Event delegation triggered change for:', e.target.id || e.target.name || e.target.value);
    updatePrice();
  }
});
