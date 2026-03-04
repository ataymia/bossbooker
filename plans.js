/**
 * plans.js — Boss Booker Pricing Data Model & Utilities
 *
 * Pure data + helpers. No DOM manipulation, no event listeners.
 * The plans.html page handles all rendering and interaction inline.
 *
 * Everything is exposed via window.BossBookerPricing to avoid
 * polluting the global scope or conflicting with inline page logic.
 */
(function () {
  'use strict';

  // ── Plan Pricing ─────────────────────────────────────────────────
  // Keys match the plan slugs used in plans.html.
  // billing_type: one_time | monthly | custom_quote | per_booking
  const PLAN_PRICING = {

    /* ── Foundation (One-time) ──────────────────────────────────── */
    'foundation-lite': {
      price: 499,
      billing_type: 'one_time',
      setup: 0,
      included_features: [
        'Basic Info Page (template-based)',
        'Contact or booking form',
        'Google Business Profile setup',
        'Social links integration',
        'Brand presence checklist'
      ],
      limits: { revisions: 1 },
      disclosures: []
    },
    'foundation-standard': {
      price: 999,
      billing_type: 'one_time',
      setup: 0,
      included_features: [
        'Conversion Landing Page (lead capture + tracking)',
        'CRM setup (pipeline + automations)',
        'Google Business Profile optimization',
        'Missed-call text-back',
        'Social links integration',
        'Analytics/pixel-ready',
        '30-day support'
      ],
      limits: { revisions: 2 },
      disclosures: []
    },
    'foundation-plus': {
      price: 1499,
      billing_type: 'one_time',
      setup: 0,
      included_features: [
        'Multi-page website (up to 5 pages)',
        'Full CRM + automations',
        'GBP + basic local signals',
        'SMS templates + missed-call text-back',
        'Analytics dashboard',
        '60-day support'
      ],
      limits: { revisions: 3 },
      disclosures: []
    },

    /* ── Growth (Monthly) ───────────────────────────────────────── */
    'growth-lite': {
      price: 599,
      billing_type: 'monthly',
      setup: 0,
      included_features: [
        '60 outreach attempts/mo',
        'Automated follow-up sequences (3-touch)',
        'CRM pipeline management',
        'Missed-call text-back',
        'Weekly KPI email',
        '15-min monthly strategy call'
      ],
      limits: { attempts_per_month: 60 },
      disclosures: ['attempt_definition']
    },
    'growth-standard': {
      price: 999,
      billing_type: 'monthly',
      setup: 0,
      included_features: [
        '120 outreach attempts/mo',
        'Automated follow-ups (4-touch + rules)',
        'Pick 1: Google Ads OR GBP + Local Presence',
        'SMS assistant + templates',
        'Analytics dashboard',
        'Monthly performance report',
        '30-min monthly strategy call'
      ],
      limits: { attempts_per_month: 120 },
      disclosures: ['attempt_definition', 'ad_spend_separate']
    },
    'growth-plus': {
      price: 1899,
      billing_type: 'monthly',
      setup: 0,
      included_features: [
        '300 outreach attempts/mo',
        'Advanced follow-ups (5-touch + smart rules)',
        'Google Ads + GBP + Local Presence',
        'Website included or 50% credit',
        'AI chat widget',
        'Weekly KPI + monthly report',
        '45-min monthly strategy call'
      ],
      limits: { attempts_per_month: 300 },
      disclosures: ['attempt_definition', 'ad_spend_separate']
    },

    /* ── Automation + Ops (Monthly) ─────────────────────────────── */
    'ops-standard': {
      price: 2999,
      billing_type: 'monthly',
      setup: 0,
      included_features: [
        '600 outreach attempts/mo',
        'Everything in Growth Plus',
        'Full CRM (pipelines, stages, custom fields)',
        'Automations (missed-call text-back, follow-up sequences, routing)',
        'SMS/email templates (customization included)',
        'Dedicated success manager',
        'Bi-weekly strategy calls',
        'Monthly report + analytics dashboard'
      ],
      limits: { attempts_per_month: 600 },
      disclosures: ['attempt_definition', 'ad_spend_separate']
    },
    'ops-pro': {
      price: 4199,
      billing_type: 'monthly',
      setup: 0,
      included_features: [
        '1,200 outreach attempts/mo',
        'Everything in Ops Standard',
        'Multi-location support',
        'Advanced ads (Google + Meta)',
        'Content calendar + social posting',
        'Advanced CRM automations',
        'Full analytics dashboards',
        'Quarterly executive reviews'
      ],
      limits: { attempts_per_month: 1200 },
      disclosures: ['attempt_definition', 'ad_spend_separate']
    },
    'ops-enterprise': {
      price: 0,
      billing_type: 'custom_quote',
      setup: 0,
      custom: true,
      included_features: [
        'Everything in Ops Pro',
        'Unlimited outreach attempts',
        'Dedicated account team',
        'Custom SLAs',
        'White-label options',
        'API access + custom integrations',
        'Multi-location management'
      ],
      limits: {},
      disclosures: ['attempt_definition', 'ad_spend_separate']
    },

    /* ── Performance-based ──────────────────────────────────────── */
    'performance-booking': {
      price: 0,
      billing_type: 'per_booking',
      setup: 0,
      custom: true,
      included_features: [
        'Confirmed, qualified appointments',
        'Custom qualification criteria',
        'Dedicated booking team'
      ],
      limits: {},
      disclosures: ['performance_booking_definition']
    },

    /* ── Builder tiers (legacy / shorthand) ─────────────────────── */
    'nano':       { price: 599,  billing_type: 'monthly',      setup: 0 },
    'micro':      { price: 799,  billing_type: 'monthly',      setup: 299 },
    'pro':        { price: 3799, billing_type: 'monthly',      setup: 0 },
    'scale':      { price: 4199, billing_type: 'monthly',      setup: 1200 },
    'enterprise': { price: 0,    billing_type: 'custom_quote', setup: 0, custom: true },

    /* ── GLAM ───────────────────────────────────────────────────── */
    'glam-nano':  { price: 149, billing_type: 'monthly', setup: 79 },
    'glam-micro': { price: 299, billing_type: 'monthly', setup: 129 },
    'glam-pro':   { price: 599, billing_type: 'monthly', setup: 179 },

    /* ── Website options (one-time) ─────────────────────────────── */
    'basic-info-page':         { price: 349, billing_type: 'one_time', setup: 0 },
    'conversion-landing-page': { price: 599, billing_type: 'one_time', setup: 0 }
  };

  // ── Business Card Pricing (one-time per order) ───────────────────
  const BUSINESS_CARD_PRICING = {
    template: {
      single: { 100: 75,  250: 125, 1000: 325 },
      double: { 100: 95,  250: 155, 1000: 395 }
    },
    custom: {
      single: { 100: 165, 250: 245, 1000: 525 },
      double: { 100: 215, 250: 315, 1000: 625 }
    },
    addon: {
      template: { single: 55, double: 75 },
      custom:   { single: 95, double: 125 }
    }
  };

  // ── Disclosure Definitions ───────────────────────────────────────
  // Referenced by the disclosures[] arrays in PLAN_PRICING entries.
  const DISCLOSURES = {
    attempt_definition:
      'An attempt is one outbound contact action through an approved channel ' +
      '(call, SMS, email, or DM) to a specific lead. Multiple actions to the ' +
      'same lead count as separate attempts. Attempts measure outreach volume ' +
      'and do not guarantee contact or booking.',
    ad_spend_separate:
      'Ad spend is paid separately by the client. Management fees cover ' +
      'strategy, setup, optimization, and reporting.',
    business_cards_shipping:
      'Printing included. Shipping billed separately. Pickup available.',
    performance_booking_definition:
      'A booked appointment is a confirmed date/time on calendar meeting ' +
      'minimum qualification rules. No-shows, cancellations, duplicates, ' +
      'and unqualified leads do not count.',
    business_hours:
      'Default business hours are Monday through Friday, 9:00 AM to ' +
      '5:00 PM local time. Business hours can be customized during onboarding.',
    revisions:
      'A revision is a set of changes to existing layout or copy. Does not ' +
      'include full redesign. Additional rounds are $25 each.'
  };

  // ── Helpers ──────────────────────────────────────────────────────

  /**
   * Format a number as USD currency string.
   * @param {number} value
   * @returns {string} e.g. "$1,499"
   */
  function fmtCurrency(value) {
    if (typeof value !== 'number' || Number.isNaN(value)) return '$0';
    return '$' + value.toLocaleString('en-US');
  }

  /**
   * Look up a plan by slug and return a normalized info object.
   * Returns null when the slug is not found.
   *
   * @param {string} slug - Plan key (e.g. 'growth-standard')
   * @returns {Object|null}
   */
  function getPlanInfo(slug) {
    const plan = PLAN_PRICING[slug];
    if (!plan) return null;

    // Resolve any referenced disclosure texts
    const resolvedDisclosures = (plan.disclosures || []).map(function (key) {
      if (!DISCLOSURES[key]) {
        console.warn('[BossBookerPricing] Unknown disclosure key: ' + key);
      }
      return DISCLOSURES[key] || key;
    });

    return {
      slug: slug,
      price: plan.price,
      billing_type: plan.billing_type,
      setup: plan.setup,
      custom: !!plan.custom,
      included_features: plan.included_features || [],
      limits: plan.limits || {},
      disclosures: resolvedDisclosures
    };
  }

  // ── Public API (window.BossBookerPricing) ────────────────────────
  window.BossBookerPricing = {
    PLAN_PRICING: PLAN_PRICING,
    BUSINESS_CARD_PRICING: BUSINESS_CARD_PRICING,
    DISCLOSURES: DISCLOSURES,
    fmtCurrency: fmtCurrency,
    getPlanInfo: getPlanInfo
  };

})();
