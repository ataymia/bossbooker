/**
 * Plans builder — Boss Booker
 * Fixed: reliable wiring + tiered add-ons update + enterprise contact pricing.
 *
 * Drop this file in place of the existing plans.js and reload the page.
 * Console.log/debug statements are included for quick verification.
 */

// Pricing map (monthly, one-time setup). enterprise.custom = true => Contact for pricing
const PLAN_PRICING = {
  nano: { monthly: 599, setup: 0 },
  micro: { monthly: 799, setup: 299 },
  starter: { monthly: 1899, setup: 0 },
  pro: { monthly: 3799, setup: 0 },
  scale: { monthly: 4199, setup: 1200 },
  enterprise: { monthly: 0, setup: 0, custom: true },
  smallbusiness: { monthly: 199, setup: 399 },
  glam_nano: { monthly: 149, setup: 79 },
  glam_micro: { monthly: 299, setup: 129 },
  glam_pro: { monthly: 599, setup: 179 }
};

// small helper to format currency
function fmtCurrency(v) {
  if (typeof v !== 'number' || Number.isNaN(v)) return '$0';
  return `$${v.toLocaleString()}`;
}

// read option metadata safely
function readOptionMeta(opt) {
  if (!opt) return null;
  const priceAttr = opt.getAttribute('data-price');
  const onetimeAttr = opt.getAttribute('data-onetime');
  const pctAttr = opt.getAttribute('data-pct');
  const minAttr = opt.getAttribute('data-min');
  return {
    value: opt.value || '',
    label: (opt.textContent || opt.innerText || opt.value).trim(),
    price: priceAttr !== null && priceAttr !== '' ? parseFloat(priceAttr) : null,
    onetime: onetimeAttr === 'true',
    pct: pctAttr ? parseFloat(pctAttr) : null,
    min: minAttr ? parseFloat(minAttr) : null
  };
}

// compute totals and update UI
function updatePrice() {
  // find selected base plan
  const baseRadio = document.querySelector('input[name="basePlan"]:checked');
  const basePlan = baseRadio ? baseRadio.value : 'starter';
  const planInfo = PLAN_PRICING[basePlan] || { monthly: 0, setup: 0 };

  console.debug('[updatePrice] basePlan=', basePlan);

  // starting totals from base plan
  let monthlyTotal = Number(planInfo.monthly || 0);
  let onetimeTotal = Number(planInfo.setup || 0);

  // tiered selects (select.addon-select) - fallback to any select with id starting with addon_
  const selectEls = Array.from(document.querySelectorAll('select.addon-select, select[id^="addon_"]'));
  let ppcScaleNote = '';

  selectEls.forEach(sel => {
    const idx = sel.selectedIndex;
    if (idx <= 0) return; // no selection or 'None'
    const opt = sel.options[idx];
    const meta = readOptionMeta(opt);
    if (!meta) return;

    // handle PPC scale % (data-pct) as note only
    if (meta.pct) {
      ppcScaleNote = `${meta.label} — ${meta.pct}% of ad spend (min ${fmtCurrency(meta.min || 0)})`;
      // do NOT add numeric amount
      return;
    }

    // numeric price handling
    const price = Number(meta.price || 0);
    if (meta.onetime) onetimeTotal += price;
    else monthlyTotal += price;

    console.debug('[select-addon] ', sel.id || sel.name, meta.label, price, 'onetime=', meta.onetime);
  });

  // checkbox add-ons (including GLAM)
  const checkedBoxes = Array.from(document.querySelectorAll('.checkbox-group input[type="checkbox"]'))
    .filter(cb => cb.checked);

  checkedBoxes.forEach(cb => {
    // data-onetime may be on input or missing; prefer attribute then dataset
    const onetimeAttr = cb.getAttribute('data-onetime');
    const isOneTime = onetimeAttr === 'true' || cb.dataset.onetime === 'true';
    const priceRaw = cb.getAttribute('data-price') ?? cb.dataset.price ?? '0';
    const price = parseFloat(priceRaw || '0');
    if (isOneTime) onetimeTotal += price;
    else monthlyTotal += price;
    console.debug('[checkbox-addon]', cb.value || cb.name, price, 'oneTime=', isOneTime);
  });

  const firstMonthTotal = monthlyTotal + onetimeTotal;

  // Update sidebar summary
  const basePlanNameEl = document.getElementById('basePlanName');
  const monthlyEl = document.getElementById('monthlyTotal');
  const onetimeEl = document.getElementById('onetimeTotal');
  const firstEl = document.getElementById('firstMonthTotal');

  // pretty plan name
  if (basePlanNameEl) {
    let pretty = basePlan;
    if (basePlan === 'smallbusiness') pretty = 'Small Business Starter Kit';
    else if (basePlan.startsWith('glam_')) pretty = basePlan.replace('glam_', 'GLAM ').replace('_', ' ');
    else pretty = basePlan.charAt(0).toUpperCase() + basePlan.slice(1);
    basePlanNameEl.textContent = pretty;
  }

  // If enterprise -> contact for pricing
  const isEnterprise = !!(PLAN_PRICING[basePlan] && PLAN_PRICING[basePlan].custom);

  if (isEnterprise) {
    if (monthlyEl) monthlyEl.textContent = 'Contact for pricing';
    if (onetimeEl) onetimeEl.textContent = 'Contact for pricing';
    if (firstEl) firstEl.textContent = 'Contact for pricing';
  } else {
    if (monthlyEl) monthlyEl.textContent = fmtCurrency(monthlyTotal);
    if (onetimeEl) onetimeEl.textContent = fmtCurrency(onetimeTotal);
    if (firstEl) firstEl.textContent = fmtCurrency(firstMonthTotal);
  }

  // Save PPC Scale note (hidden element used by copyQuote)
  const ppcNoteHolder = document.getElementById('ppcScaleNote');
  if (ppcNoteHolder) ppcNoteHolder.textContent = ppcScaleNote;

  console.debug('[updatePrice] monthly=', monthlyEl?.textContent, 'one-time=', onetimeEl?.textContent, 'first=', firstEl?.textContent, 'ppcNote=', ppcScaleNote);
}

// prepare and wire listeners in a robust way
function wireAndInit() {
  // Run updatePrice on load
  updatePrice();

  // Listen for changes on the document; this is simple and reliable
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (!t) return;
    // react to basePlan radios, selects, and add-on checkboxes
    if (
      (t.matches && t.matches('input[name="basePlan"]')) ||
      (t.tagName && t.tagName.toLowerCase() === 'select') ||
      (t.tagName && t.tagName.toLowerCase() === 'input' && (t.type === 'checkbox' || t.type === 'radio'))
    ) {
      // tiny delay ensures DOM state is settled
      setTimeout(updatePrice, 0);
    }
  });

  // Also attach direct listeners for immediate reaction (helps older browsers)
  const selects = Array.from(document.querySelectorAll('select.addon-select, select[id^="addon_"]'));
  selects.forEach(s => s.addEventListener('change', updatePrice));
  const checkboxes = Array.from(document.querySelectorAll('.checkbox-group input[type="checkbox"]'));
  checkboxes.forEach(cb => cb.addEventListener('change', updatePrice));
  const baseRadios = Array.from(document.querySelectorAll('input[name="basePlan"]'));
  baseRadios.forEach(r => r.addEventListener('change', updatePrice));

  console.debug('[wireAndInit] listeners attached:', {
    selects: selects.length,
    checkboxes: checkboxes.length,
    baseRadios: baseRadios.length
  });
}

// copyQuote: composes quote (reads ppcScale note from hidden holder)
function copyQuote() {
  const baseRadio = document.querySelector('input[name="basePlan"]:checked');
  const basePlan = baseRadio ? baseRadio.value : 'starter';
  const planName = document.getElementById('basePlanName')?.textContent || basePlan;
  const monthly = document.getElementById('monthlyTotal')?.textContent || '';
  const onetime = document.getElementById('onetimeTotal')?.textContent || '';
  const first = document.getElementById('firstMonthTotal')?.textContent || '';

  // included features snapshot (small list)
  const included = (window.PLAN_FEATURES && window.PLAN_FEATURES[basePlan]) ? window.PLAN_FEATURES[basePlan] : [];

  // tiered selects summary
  const selectEls = Array.from(document.querySelectorAll('select.addon-select, select[id^="addon_"]'));
  const tiered = selectEls
    .map(sel => {
      const opt = sel.options[sel.selectedIndex];
      if (!opt || !opt.value) return null;
      const meta = readOptionMeta(opt);
      if (!meta) return null;
      if (meta.pct) return `${meta.label} — ${meta.pct}% of ad spend (min ${fmtCurrency(meta.min || 0)})`;
      return `${meta.label} — ${meta.onetime ? fmtCurrency(meta.price) + ' (one-time)' : fmtCurrency(meta.price) + '/mo' }`;
    })
    .filter(Boolean);

  // checkbox add-ons
  const addons = Array.from(document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked'))
    .map(cb => {
      const price = parseFloat(cb.getAttribute('data-price') ?? cb.dataset.price ?? '0') || 0;
      const one = (cb.getAttribute('data-onetime') === 'true' || cb.dataset.onetime === 'true');
      const label = cb.parentElement?.innerText?.trim?.() || cb.value;
      return `${label} ${one ? '(one-time)' : ''} — ${fmtCurrency(price)}`;
    });

  const ppcNote = document.getElementById('ppcScaleNote')?.textContent || '';

  const parts = [
    "Boss Booker — Quote",
    `Plan: ${planName}`,
    `Monthly: ${monthly}`,
    `One-time Setup Fee: ${onetime}`,
    `First Month Due: ${first}`,
    included.length ? `Included features:\n- ${included.join('\n- ')}` : "Included features: (none)"
  ];

  if (tiered.length) parts.push(`Tiered add-ons:\n- ${tiered.join('\n- ')}`);
  if (addons.length) parts.push(`Additional add-ons:\n- ${addons.join('\n- ')}`);
  if (ppcNote) parts.push(`Note: ${ppcNote}`);

  const payload = parts.join('\n\n');
  navigator.clipboard.writeText(payload).then(() => alert('Quote copied to clipboard')).catch(() => alert('Could not copy — select & copy manually.'));
}

// Service Request Modal
function openServiceRequestModal() {
  const modal = document.getElementById('serviceRequestModal');
  const summary = document.getElementById('modalPlanSummary');
  
  // Get current plan details
  const basePlan = document.getElementById('basePlanName')?.textContent || '';
  const monthly = document.getElementById('monthlyTotal')?.textContent || '';
  const setup = document.getElementById('onetimeTotal')?.textContent || '';
  const first = document.getElementById('firstMonthTotal')?.textContent || '';
  
  summary.innerHTML = `
    <strong>Plan:</strong> ${basePlan}<br>
    <strong>Monthly:</strong> ${monthly}<br>
    <strong>Setup Fee:</strong> ${setup}<br>
    <strong>First Month:</strong> ${first}
  `;
  
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeServiceRequestModal() {
  const modal = document.getElementById('serviceRequestModal');
  modal.style.display = 'none';
  document.body.style.overflow = '';
}

// Handle service request form submission
function handleServiceRequestSubmit(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const request = {
    id: 'request_' + Date.now(),
    companyName: formData.get('companyName'),
    contactName: formData.get('contactName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    companySize: formData.get('companySize') || '',
    address: formData.get('address') || '',
    notes: formData.get('notes') || '',
    planName: document.getElementById('basePlanName')?.textContent || '',
    monthlyTotal: document.getElementById('monthlyTotal')?.textContent || '',
    setupFee: document.getElementById('onetimeTotal')?.textContent || '',
    firstMonthTotal: document.getElementById('firstMonthTotal')?.textContent || '',
    timestamp: Date.now(),
    status: 'new'
  };
  
  // Save to localStorage for admin portal
  try {
    const requests = JSON.parse(localStorage.getItem('bossbooker_requests') || '[]');
    requests.unshift(request); // Add to beginning
    localStorage.setItem('bossbooker_requests', JSON.stringify(requests));
  } catch (error) {
    console.error('Error saving request:', error);
  }
  
  // Close modal and show success
  closeServiceRequestModal();
  alert('Thank you! Your service request has been submitted. We\'ll contact you at ' + request.email + ' within 1 business day.');
  e.target.reset();
}

// expose functions globally for the button's onclick
window.copyQuote = copyQuote;
window.openServiceRequestModal = openServiceRequestModal;
window.closeServiceRequestModal = closeServiceRequestModal;

// init after DOM ready
document.addEventListener('DOMContentLoaded', () => {
  wireAndInit();
  // initial calc
  updatePrice();
  
  // Setup service request form
  const serviceForm = document.getElementById('serviceRequestForm');
  if (serviceForm) {
    serviceForm.addEventListener('submit', handleServiceRequestSubmit);
  }
  
  // Close modal on outside click
  document.getElementById('serviceRequestModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'serviceRequestModal') {
      closeServiceRequestModal();
    }
  });
});
