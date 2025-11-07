/**
 * Plans builder — Boss Booker
 * Updated to support GLAM selectable bundles, keep Small Business Starter Kit,
 * keep add-ons checkable for any plan, and show totals at bottom.
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

function updatePrice() {
  const basePlanRadio = document.querySelector('input[name="basePlan"]:checked');
  const basePlanValue = basePlanRadio ? basePlanRadio.value : 'starter';
  const planData = PLAN_PRICING[basePlanValue] || { monthly: 0, setup: 0 };

  // Base monthly
  let monthlyTotal = planData.monthly || 0;

  // Monthly add-ons chosen by the user (always available a la carte)
  const monthlyAddons = Array.from(document.querySelectorAll('.checkbox-group input[type="checkbox"]'))
    .filter(el => !el.hasAttribute('data-onetime') && el.checked)
    .map(el => parseFloat(el.dataset.price || "0"))
    .reduce((a, b) => a + b, 0);

  // One-time charges from selected one-time checkboxes
  const onetimeChecksTotal = Array.from(document.querySelectorAll('.checkbox-group input[type="checkbox"][data-onetime="true"]'))
    .filter(el => el.checked)
    .map(el => parseFloat(el.dataset.price || "0"))
    .reduce((a, b) => a + b, 0);

  // Setup fee from plan + explicit one-time add-ons
  let onetimeTotal = (planData.setup || 0) + onetimeChecksTotal;

  // Total calculation
  monthlyTotal += monthlyAddons;
  const firstMonthTotal = monthlyTotal + onetimeTotal;

  // Update summary areas (aside)
  const basePlanNameElem = document.getElementById('basePlanName');
  if (basePlanNameElem) {
    let prettyName = basePlanValue;
    if (basePlanValue === 'smallbusiness') prettyName = 'Small Business Starter Kit';
    else if (basePlanValue.startsWith('glam_')) prettyName = basePlanValue.replace('glam_', 'GLAM ').replace('_', ' ');
    else prettyName = basePlanValue.charAt(0).toUpperCase() + basePlanValue.slice(1);
    basePlanNameElem.textContent = prettyName;
  }

  // Sidebar summary values
  const monthlyTotalElem = document.getElementById('monthlyTotal');
  const onetimeTotalElem = document.getElementById('onetimeTotal');
  const firstMonthElem = document.getElementById('firstMonthTotal');

  if (PLAN_PRICING[basePlanValue] && PLAN_PRICING[basePlanValue].custom) {
    if (monthlyTotalElem) monthlyTotalElem.textContent = 'Contact for pricing';
    if (onetimeTotalElem) onetimeTotalElem.textContent = 'Contact for pricing';
    if (firstMonthElem) firstMonthElem.textContent = 'Contact for pricing';
  } else {
    if (monthlyTotalElem) monthlyTotalElem.textContent = fmt(monthlyTotal);
    if (onetimeTotalElem) onetimeTotalElem.textContent = fmt(onetimeTotal);
    if (firstMonthElem) firstMonthElem.textContent = fmt(firstMonthTotal);
  }

  // Show/hide onetime row as appropriate
  const onetimeRow = document.getElementById('onetimeRow');
  if (onetimeRow) {
    onetimeRow.style.display = (onetimeTotal > 0 && !PLAN_PRICING[basePlanValue]?.custom) ? 'block' : 'none';
  }

  // Update bottom totals bar
  const bottomPlanName = document.getElementById('bottomPlanName');
  const bottomIncluded = document.getElementById('bottomIncluded');
  const bottomMonthly = document.getElementById('bottomMonthly');
  const bottomOnetime = document.getElementById('bottomOnetime');
  const bottomFirst = document.getElementById('bottomFirst');

  if (bottomPlanName) {
    bottomPlanName.textContent = basePlanNameElem ? basePlanNameElem.textContent : basePlanValue;
  }
  // Included text: list a concise preview of included features
  if (bottomIncluded) {
    const includedFeatures = PLAN_FEATURES[basePlanValue] || [];
    bottomIncluded.textContent = includedFeatures.length ? includedFeatures.slice(0,2).join(' • ') : 'Includes core features';
  }

  if (PLAN_PRICING[basePlanValue] && PLAN_PRICING[basePlanValue].custom) {
    if (bottomMonthly) bottomMonthly.textContent = 'Contact';
    if (bottomOnetime) bottomOnetime.textContent = 'Contact';
    if (bottomFirst) bottomFirst.textContent = 'Contact';
  } else {
    if (bottomMonthly) bottomMonthly.textContent = fmt(monthlyTotal);
    if (bottomOnetime) bottomOnetime.textContent = fmt(onetimeTotal);
    if (bottomFirst) bottomFirst.textContent = fmt(firstMonthTotal);
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

  // optional add-ons selected (when user explicitly chooses extras)
  const addons = Array.from(document.querySelectorAll('.checkbox-group input[type="checkbox"]'))
    .filter(el => el.checked)
    .map(el => el.parentElement?.innerText.trim().replace(/\s+/g, ' ') || '')
    .filter(Boolean);

  const payload = [
    "Boss Booker — Quote",
    `Plan: ${planName}`,
    `Monthly: ${monthly}`,
    `One-time Setup Fee: ${onetime}`,
    `First Month Due: ${first}`,
    included.length ? `Included features:\n- ${included.join('\n- ')}` : "Included features: (none)",
    addons.length ? `Additional add-ons selected:\n- ${addons.join('\n- ')}` : ""
  ].filter(Boolean).join("\n\n");

  navigator.clipboard.writeText(payload)
    .then(() => alert('Quote copied to clipboard'))
    .catch(() => alert('Could not copy — select & copy manually.'));
}

// initialize
document.addEventListener('DOMContentLoaded', () => {
  updatePrice();
});
