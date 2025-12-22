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

// Business Card Pricing (per order, one-time)
const BUSINESS_CARD_PRICING = {
  template: {
    single: { 100: 75, 250: 125, 1000: 325 },
    double: { 100: 95, 250: 155, 1000: 395 }
  },
  custom: {
    single: { 100: 165, 250: 245, 1000: 525 },
    double: { 100: 215, 250: 315, 1000: 625 }
  },
  addon: {
    template: { single: 55, double: 75 },
    custom: { single: 95, double: 125 }
  }
};

// Business Card state
let businessCardSelection = null;

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

  // Add business card selection if present (one-time cost)
  if (businessCardSelection) {
    onetimeTotal += businessCardSelection.total;
    console.debug('[business-card-addon]', businessCardSelection.total, 'oneTime=true');
  }

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

  // Add business card selection to addons list
  const bcSummary = getBusinessCardSummary();
  if (bcSummary) {
    addons.push(`${bcSummary.text} (one-time)`);
  }

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
  
  let summaryHTML = `
    <strong>Plan:</strong> ${basePlan}<br>
    <strong>Monthly:</strong> ${monthly}<br>
    <strong>Setup Fee:</strong> ${setup}<br>
    <strong>First Month:</strong> ${first}
  `;
  
  // Add business card selection if present
  const bcSummary = getBusinessCardSummary();
  if (bcSummary) {
    summaryHTML += `<br><br><strong>Business Cards:</strong><br>${bcSummary.text}`;
  }
  
  summary.innerHTML = summaryHTML;
  
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeServiceRequestModal() {
  const modal = document.getElementById('serviceRequestModal');
  modal.style.display = 'none';
  document.body.style.overflow = '';
}

// Handle service request form submission
async function handleServiceRequestSubmit(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const requestData = {
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
    businessCardSelection: businessCardSelection ? getBusinessCardSummary().text : null
  };
  
  // Try to save to Cloudflare Worker API first
  let success = false;
  if (window.API_CONFIG && !window.API_CONFIG.USE_LOCALSTORAGE_FALLBACK) {
    try {
      const response = await fetch(`${window.API_CONFIG.WORKER_URL}${window.API_CONFIG.ENDPOINTS.REQUEST}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (response.ok) {
        success = true;
      } else {
        console.error('Worker API error:', await response.text());
      }
    } catch (error) {
      console.error('Error contacting Worker API:', error);
    }
  }
  
  // Fallback to localStorage if Worker API fails or is not configured
  if (!success) {
    try {
      const request = {
        id: 'request_' + Date.now(),
        ...requestData,
        timestamp: Date.now(),
        status: 'new'
      };
      const requests = JSON.parse(localStorage.getItem('bossbooker_requests') || '[]');
      requests.unshift(request);
      localStorage.setItem('bossbooker_requests', JSON.stringify(requests));
      success = true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }
  
  // Close modal and show success/error
  closeServiceRequestModal();
  if (success) {
    alert('Thank you! Your service request has been submitted. We\'ll contact you at ' + requestData.email + ' within 1 business day.');
    e.target.reset();
  } else {
    alert('Sorry, there was an error submitting your request. Please try again or email us directly at bossbookerinfo@gmail.com');
  }
}

// expose functions globally for the button's onclick
window.copyQuote = copyQuote;
window.openServiceRequestModal = openServiceRequestModal;
window.closeServiceRequestModal = closeServiceRequestModal;

// Business Card Modal Functions
function openBusinessCardModal() {
  const modal = document.getElementById('businessCardModal');
  if (!modal) return;
  
  // Initialize with current selection or defaults
  if (businessCardSelection) {
    // Restore previous selection
    const packageRadio = document.querySelector(`input[name="bcPackage"][value="${businessCardSelection.package}"]`);
    const sidesRadio = document.querySelector(`input[name="bcSides"][value="${businessCardSelection.sides}"]`);
    const qtyRadio = document.querySelector(`input[name="bcQuantity"][value="${businessCardSelection.quantity}"]`);
    const addonCheckbox = document.getElementById('bcAddon100');
    
    if (packageRadio) packageRadio.checked = true;
    if (sidesRadio) sidesRadio.checked = true;
    if (qtyRadio) qtyRadio.checked = true;
    if (addonCheckbox) addonCheckbox.checked = businessCardSelection.addon;
  }
  
  updateBusinessCardPrice();
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeBusinessCardModal() {
  const modal = document.getElementById('businessCardModal');
  if (!modal) return;
  modal.style.display = 'none';
  document.body.style.overflow = '';
}

function updateBusinessCardPrice() {
  const packageRadio = document.querySelector('input[name="bcPackage"]:checked');
  const sidesRadio = document.querySelector('input[name="bcSides"]:checked');
  const qtyRadio = document.querySelector('input[name="bcQuantity"]:checked');
  const addonCheckbox = document.getElementById('bcAddon100');
  
  if (!packageRadio || !sidesRadio || !qtyRadio) return;
  
  const packageType = packageRadio.value; // 'template' or 'custom'
  const sides = sidesRadio.value; // 'single' or 'double'
  const quantity = qtyRadio.value; // '100', '250', '1000'
  const hasAddon = addonCheckbox ? addonCheckbox.checked : false;
  
  // Calculate base price
  let total = BUSINESS_CARD_PRICING[packageType][sides][quantity];
  
  // Add addon if selected
  if (hasAddon) {
    total += BUSINESS_CARD_PRICING.addon[packageType][sides];
  }
  
  // Update display
  const totalEl = document.getElementById('bcTotalPrice');
  const breakdownEl = document.getElementById('bcBreakdown');
  
  if (totalEl) {
    totalEl.textContent = fmtCurrency(total);
  }
  
  if (breakdownEl) {
    const pkgLabel = packageType.charAt(0).toUpperCase() + packageType.slice(1);
    const sidesLabel = sides.charAt(0).toUpperCase() + sides.slice(1);
    const qtyLabel = quantity;
    const addonLabel = hasAddon ? 'Yes' : 'No';
    breakdownEl.textContent = `Package: ${pkgLabel} • Sides: ${sidesLabel} • Qty: ${qtyLabel} • Add-on: ${addonLabel}`;
  }
}

function applyBusinessCardSelection() {
  const packageRadio = document.querySelector('input[name="bcPackage"]:checked');
  const sidesRadio = document.querySelector('input[name="bcSides"]:checked');
  const qtyRadio = document.querySelector('input[name="bcQuantity"]:checked');
  const addonCheckbox = document.getElementById('bcAddon100');
  
  if (!packageRadio || !sidesRadio || !qtyRadio) return;
  
  const packageType = packageRadio.value;
  const sides = sidesRadio.value;
  const quantity = qtyRadio.value;
  const hasAddon = addonCheckbox ? addonCheckbox.checked : false;
  
  // Calculate total
  let total = BUSINESS_CARD_PRICING[packageType][sides][quantity];
  if (hasAddon) {
    total += BUSINESS_CARD_PRICING.addon[packageType][sides];
  }
  
  // Store selection
  businessCardSelection = {
    package: packageType,
    sides: sides,
    quantity: quantity,
    addon: hasAddon,
    total: total
  };
  
  // Update summary in the add-ons section
  const summaryEl = document.getElementById('businessCardSummary');
  if (summaryEl) {
    const pkgLabel = packageType.charAt(0).toUpperCase() + packageType.slice(1);
    const sidesLabel = sides.charAt(0).toUpperCase() + sides.slice(1);
    const addonLabel = hasAddon ? ' + 100 more' : '';
    summaryEl.innerHTML = `<strong>Selected:</strong> ${pkgLabel}, ${sidesLabel}-sided, ${quantity} cards${addonLabel} — <strong style="color: var(--primary-color);">${fmtCurrency(total)}</strong> (one-time)`;
    summaryEl.style.display = 'block';
  }
  
  closeBusinessCardModal();
  
  // Update main price calculation to include this one-time cost
  updatePrice();
}

function getBusinessCardSummary() {
  if (!businessCardSelection) return null;
  
  const pkgLabel = businessCardSelection.package.charAt(0).toUpperCase() + businessCardSelection.package.slice(1);
  const sidesLabel = businessCardSelection.sides.charAt(0).toUpperCase() + businessCardSelection.sides.slice(1);
  const addonLabel = businessCardSelection.addon ? ', Add-on +100: Yes' : ', Add-on +100: No';
  
  return {
    text: `Business Cards — ${pkgLabel}, ${sidesLabel}, ${businessCardSelection.quantity}${addonLabel}. Total: ${fmtCurrency(businessCardSelection.total)}`,
    price: businessCardSelection.total
  };
}

window.openBusinessCardModal = openBusinessCardModal;
window.closeBusinessCardModal = closeBusinessCardModal;
window.updateBusinessCardPrice = updateBusinessCardPrice;
window.applyBusinessCardSelection = applyBusinessCardSelection;

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
  
  // Close business card modal on outside click
  document.getElementById('businessCardModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'businessCardModal') {
      closeBusinessCardModal();
    }
  });
  
  // Add direct event listeners for mobile compatibility (supplement onclick)
  // This ensures buttons work even if onclick fails on some mobile browsers
  const submitButton = document.querySelector('button[onclick="openServiceRequestModal()"]');
  if (submitButton) {
    submitButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openServiceRequestModal();
    });
  }
  
  const copyButton = document.querySelector('button[onclick="copyQuote()"]');
  if (copyButton) {
    copyButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      copyQuote();
    });
  }
});
