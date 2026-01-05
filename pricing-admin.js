/**
 * Boss Booker - Pricing Admin Module
 * Manage plans, add-ons, and promotions from the admin portal
 */

(function(global) {
    'use strict';

    const STORAGE_KEY = 'bb_pricing_config';

    // Default pricing configuration
    const DEFAULT_PRICING = {
        sale: {
            active: false,
            name: '',
            discount: 10,
            endDate: null
        },
        plans: [
            // Starter Pack tiers
            { id: 'starter_lite', name: 'Starter Lite', price: 0, setup: 499, featured: false, category: 'starter', description: 'One-pager website, basic CRM setup, and appointment scheduling' },
            { id: 'starter_standard', name: 'Starter Standard', price: 0, setup: 899, featured: false, category: 'starter', description: 'Multi-page website (up to 5 pages), CRM, scheduling, and basic automation' },
            { id: 'starter_pro', name: 'Starter Pro', price: 0, setup: 1499, featured: true, category: 'starter', description: 'Full custom website, advanced CRM, automation flows, and onboarding support' },
            // Growth Engine tiers
            { id: 'growth_essentials', name: 'Growth Essentials', price: 599, setup: 299, featured: false, category: 'growth', description: 'SEO Starter OR PPC Starter, automated follow-ups, monthly reporting' },
            { id: 'growth_accelerator', name: 'Growth Accelerator', price: 999, setup: 499, featured: true, category: 'growth', description: 'SEO + PPC combo, email campaigns, SMS outreach, conversion optimization' },
            { id: 'growth_dominator', name: 'Growth Dominator', price: 1599, setup: 799, featured: false, category: 'growth', description: 'Full marketing suite, multi-channel campaigns, A/B testing, dedicated strategist' },
            // Operator tiers
            { id: 'operator_core', name: 'Operator Core', price: 2999, setup: 0, featured: false, category: 'operator', description: 'Full pipeline management, weekly optimization, monthly strategy calls' },
            { id: 'operator_plus', name: 'Operator Plus', price: 4499, setup: 0, featured: true, category: 'operator', description: 'Everything in Core plus content creation, social management, priority support' },
            { id: 'operator_elite', name: 'Operator Elite', price: 0, setup: 0, featured: false, category: 'operator', custom: true, description: 'Custom enterprise solution. Multi-location, custom integrations, dedicated team. Contact for pricing.' },
            // Special packages
            { id: 'smallbusiness', name: 'Small Business Starter Kit', price: 99, setup: 199, featured: false, special: true, description: 'For businesses under 10 employees. 1-page site, CRM basics, appointment booking, starter automation, 30-day support.' }
        ],
        glamPlans: [
            { id: 'glam_nano', name: 'GLAM Nano', price: 149, setup: 79, description: 'Link-in-bio booking hub, DM auto-replies, reminders, 2 templated posts/mo.' },
            { id: 'glam_micro', name: 'GLAM Micro', price: 299, setup: 129, description: 'Everything in Nano plus 8 templated posts/mo, story calendar, waitlist & slot-drop SMS.' },
            { id: 'glam_pro', name: 'GLAM Pro', price: 599, setup: 179, description: 'Everything in Micro plus 20 posts/mo, 2 light clip trims/mo, boosted-post advising.' }
        ],
        businessCards: {
            template: {
                single: { qty100: 29, qty250: 49, qty1000: 99 },
                double: { qty100: 39, qty250: 69, qty1000: 129 }
            },
            custom: {
                single: { qty100: 79, qty250: 99, qty1000: 149 },
                double: { qty100: 99, qty250: 129, qty1000: 179 }
            }
        },
        tieredAddons: [
            {
                id: 'websites',
                name: 'Websites (one-time)',
                tiers: [
                    { id: 'site_onepager', name: 'One-pager', price: 499, onetime: true },
                    { id: 'site_lp', name: 'Landing Page', price: 799, onetime: true },
                    { id: 'site_minisite', name: 'Mini-site (3-5 pages)', price: 1499, onetime: true },
                    { id: 'site_full', name: 'Full site (6-10 pages)', price: 2999, onetime: true },
                    { id: 'site_custom', name: 'Custom/E-commerce', price: 4999, onetime: true }
                ]
            },
            {
                id: 'seo',
                name: 'SEO Services',
                tiers: [
                    { id: 'seo_starter', name: 'Starter', price: 299 },
                    { id: 'seo_growth', name: 'Growth', price: 599 },
                    { id: 'seo_pro', name: 'Pro', price: 999 },
                    { id: 'seo_enterprise', name: 'Enterprise', price: 1999 }
                ]
            },
            {
                id: 'ppc',
                name: 'PPC/Ads Management',
                tiers: [
                    { id: 'ppc_starter', name: 'Starter (up to $1k spend)', price: 299 },
                    { id: 'ppc_growth', name: 'Growth (up to $3k spend)', price: 499 },
                    { id: 'ppc_pro', name: 'Pro (up to $10k spend)', price: 999 },
                    { id: 'ppc_scale', name: 'Scale (10%+ of spend)', price: 0, percentBased: true, percent: 10 }
                ]
            },
            {
                id: 'automation',
                name: 'Automation Packages',
                tiers: [
                    { id: 'auto_basic', name: 'Basic (5 workflows)', price: 199, onetime: true },
                    { id: 'auto_standard', name: 'Standard (15 workflows)', price: 499, onetime: true },
                    { id: 'auto_advanced', name: 'Advanced (unlimited)', price: 999, onetime: true }
                ]
            }
        ],
        flatAddons: [
            { id: 'sms_assistant', name: 'SMS Assistant (text bot)', price: 99, onetime: false },
            { id: 'ai_chat', name: 'Website AI Chat', price: 79, onetime: false },
            { id: 'analytics', name: 'Analytics Dashboard', price: 49, onetime: false },
            { id: 'reputation', name: 'Reputation Management', price: 149, onetime: false },
            { id: 'social_posting', name: 'Social Media Scheduling', price: 99, onetime: false },
            { id: 'email_campaigns', name: 'Email Campaign Tool', price: 79, onetime: false },
            { id: 'crm_migration', name: 'CRM Data Migration', price: 299, onetime: true },
            { id: 'training', name: '1-on-1 Training Session', price: 149, onetime: true },
            { id: 'priority_support', name: 'Priority Support', price: 199, onetime: false },
            { id: 'one_page_portfolio', name: 'One-page Portfolio (GLAM)', price: 499, onetime: true },
            { id: 'policy_forms', name: 'Policy/Intake Forms', price: 99, onetime: true }
        ]
    };

    // ============================================
    // STORAGE FUNCTIONS
    // ============================================

    function loadPricing() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.warn('[PricingAdmin] Error loading pricing:', e);
        }
        return JSON.parse(JSON.stringify(DEFAULT_PRICING));
    }

    function savePricing(pricing) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(pricing));
            return true;
        } catch (e) {
            console.error('[PricingAdmin] Error saving pricing:', e);
            return false;
        }
    }

    // ============================================
    // RENDER FUNCTIONS
    // ============================================

    function renderPricingTab() {
        const pricing = loadPricing();
        
        // Render sale settings
        renderSaleSettings(pricing.sale);
        
        // Render plans
        renderPlans(pricing.plans);
        
        // Render GLAM plans
        renderGlamPlans(pricing.glamPlans);
        
        // Render business cards
        renderBusinessCards(pricing.businessCards);
        
        // Render tiered addons
        renderTieredAddons(pricing.tieredAddons);
        
        // Render flat addons
        renderFlatAddons(pricing.flatAddons);
    }

    function renderSaleSettings(sale) {
        const activeCheckbox = document.getElementById('saleActive');
        const nameInput = document.getElementById('saleName');
        const discountInput = document.getElementById('saleDiscount');
        const endDateInput = document.getElementById('saleEndDate');
        
        if (activeCheckbox) activeCheckbox.checked = sale.active;
        if (nameInput) nameInput.value = sale.name || '';
        if (discountInput) discountInput.value = sale.discount || 10;
        if (endDateInput && sale.endDate) {
            endDateInput.value = sale.endDate.split('T')[0];
        }
    }

    function renderBusinessCards(businessCards) {
        if (!businessCards) return;
        
        // Template single
        const tplSingle100 = document.getElementById('bc_tpl_single_100');
        const tplSingle250 = document.getElementById('bc_tpl_single_250');
        const tplSingle1000 = document.getElementById('bc_tpl_single_1000');
        if (tplSingle100) tplSingle100.value = businessCards.template?.single?.qty100 || 29;
        if (tplSingle250) tplSingle250.value = businessCards.template?.single?.qty250 || 49;
        if (tplSingle1000) tplSingle1000.value = businessCards.template?.single?.qty1000 || 99;
        
        // Template double
        const tplDouble100 = document.getElementById('bc_tpl_double_100');
        const tplDouble250 = document.getElementById('bc_tpl_double_250');
        const tplDouble1000 = document.getElementById('bc_tpl_double_1000');
        if (tplDouble100) tplDouble100.value = businessCards.template?.double?.qty100 || 39;
        if (tplDouble250) tplDouble250.value = businessCards.template?.double?.qty250 || 69;
        if (tplDouble1000) tplDouble1000.value = businessCards.template?.double?.qty1000 || 129;
        
        // Custom single
        const custSingle100 = document.getElementById('bc_cust_single_100');
        const custSingle250 = document.getElementById('bc_cust_single_250');
        const custSingle1000 = document.getElementById('bc_cust_single_1000');
        if (custSingle100) custSingle100.value = businessCards.custom?.single?.qty100 || 79;
        if (custSingle250) custSingle250.value = businessCards.custom?.single?.qty250 || 99;
        if (custSingle1000) custSingle1000.value = businessCards.custom?.single?.qty1000 || 149;
        
        // Custom double
        const custDouble100 = document.getElementById('bc_cust_double_100');
        const custDouble250 = document.getElementById('bc_cust_double_250');
        const custDouble1000 = document.getElementById('bc_cust_double_1000');
        if (custDouble100) custDouble100.value = businessCards.custom?.double?.qty100 || 99;
        if (custDouble250) custDouble250.value = businessCards.custom?.double?.qty250 || 129;
        if (custDouble1000) custDouble1000.value = businessCards.custom?.double?.qty1000 || 179;
    }

    function renderPlans(plans) {
        const container = document.getElementById('plansContainer');
        if (!container) return;
        
        container.innerHTML = plans.map((plan, index) => `
            <div class="pricing-item ${plan.featured ? 'featured' : ''}" data-index="${index}" data-type="plan">
                <div class="pricing-item-header">
                    <input type="text" class="pricing-item-name" value="${escHtml(plan.name)}" data-field="name" style="background:transparent;border:none;font-weight:600;font-size:16px;color:var(--text-primary);padding:0;">
                    <div class="pricing-item-actions">
                        <button onclick="PricingAdmin.toggleFeatured('plan', ${index})" title="Toggle featured">${plan.featured ? '⭐' : '☆'}</button>
                        <button class="delete" onclick="PricingAdmin.deletePlan('plan', ${index})" title="Delete">×</button>
                    </div>
                </div>
                <div class="pricing-item-prices">
                    <div class="price-field">
                        <label>Monthly $</label>
                        <input type="number" value="${plan.price}" data-field="price" ${plan.custom ? 'disabled placeholder="Custom"' : ''}>
                    </div>
                    <div class="price-field">
                        <label>Setup $</label>
                        <input type="number" value="${plan.setup}" data-field="setup" ${plan.custom ? 'disabled placeholder="Custom"' : ''}>
                    </div>
                </div>
                <div class="pricing-item-desc">
                    <textarea data-field="description" placeholder="Description...">${escHtml(plan.description || '')}</textarea>
                </div>
                ${plan.special ? '<div style="margin-top:8px;font-size:11px;color:var(--primary-color);">✦ Special standalone package</div>' : ''}
                ${plan.custom ? '<div style="margin-top:8px;font-size:11px;color:var(--text-muted);">Custom pricing - contact required</div>' : ''}
            </div>
        `).join('');
        
        // Add change listeners
        container.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('change', () => PricingAdmin.markDirty());
        });
    }

    function renderGlamPlans(glamPlans) {
        const container = document.getElementById('glamPlansContainer');
        if (!container) return;
        
        container.innerHTML = glamPlans.map((plan, index) => `
            <div class="pricing-item" data-index="${index}" data-type="glam">
                <div class="pricing-item-header">
                    <input type="text" class="pricing-item-name" value="${escHtml(plan.name)}" data-field="name" style="background:transparent;border:none;font-weight:600;font-size:16px;color:var(--text-primary);padding:0;">
                    <div class="pricing-item-actions">
                        <button class="delete" onclick="PricingAdmin.deletePlan('glam', ${index})" title="Delete">×</button>
                    </div>
                </div>
                <div class="pricing-item-prices">
                    <div class="price-field">
                        <label>Monthly $</label>
                        <input type="number" value="${plan.price}" data-field="price">
                    </div>
                    <div class="price-field">
                        <label>Setup $</label>
                        <input type="number" value="${plan.setup}" data-field="setup">
                    </div>
                </div>
                <div class="pricing-item-desc">
                    <textarea data-field="description" placeholder="Description...">${escHtml(plan.description || '')}</textarea>
                </div>
            </div>
        `).join('');
        
        container.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('change', () => PricingAdmin.markDirty());
        });
    }

    function renderTieredAddons(tieredAddons) {
        const container = document.getElementById('tieredAddonsContainer');
        if (!container) return;
        
        container.innerHTML = tieredAddons.map((category, catIndex) => `
            <div class="addon-category" data-cat-index="${catIndex}">
                <div class="addon-category-header">
                    <input type="text" value="${escHtml(category.name)}" data-field="name" placeholder="Category name">
                    <div style="display:flex;gap:8px;">
                        <button class="btn-secondary" style="padding:6px 12px;font-size:12px;" onclick="PricingAdmin.addTierToCategory(${catIndex})">+ Add Tier</button>
                        <button class="btn-secondary delete" style="padding:6px 12px;font-size:12px;" onclick="PricingAdmin.deleteCategory(${catIndex})">Delete</button>
                    </div>
                </div>
                <div class="addon-category-items">
                    ${category.tiers.map((tier, tierIndex) => `
                        <div class="addon-tier" data-tier-index="${tierIndex}">
                            <input type="text" value="${escHtml(tier.name)}" data-field="name" placeholder="Tier name">
                            <input type="number" value="${tier.price}" data-field="price" placeholder="Price">
                            <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text-muted);">
                                <input type="checkbox" ${tier.onetime ? 'checked' : ''} data-field="onetime"> 1x
                            </label>
                            <button onclick="PricingAdmin.deleteTier(${catIndex}, ${tierIndex})">×</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
        
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', () => PricingAdmin.markDirty());
        });
    }

    function renderFlatAddons(flatAddons) {
        const container = document.getElementById('flatAddonsContainer');
        if (!container) return;
        
        container.innerHTML = flatAddons.map((addon, index) => `
            <div class="pricing-item" data-index="${index}" data-type="flat">
                <div class="pricing-item-header">
                    <input type="text" class="pricing-item-name" value="${escHtml(addon.name)}" data-field="name" style="background:transparent;border:none;font-weight:600;font-size:14px;color:var(--text-primary);padding:0;width:100%;">
                    <div class="pricing-item-actions">
                        <button class="delete" onclick="PricingAdmin.deleteFlatAddon(${index})" title="Delete">×</button>
                    </div>
                </div>
                <div class="pricing-item-prices">
                    <div class="price-field">
                        <label>Price $</label>
                        <input type="number" value="${addon.price}" data-field="price">
                    </div>
                    <div class="price-field" style="display:flex;flex-direction:column;justify-content:flex-end;">
                        <label style="display:flex;align-items:center;gap:6px;">
                            <input type="checkbox" ${addon.onetime ? 'checked' : ''} data-field="onetime">
                            <span>One-time</span>
                        </label>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', () => PricingAdmin.markDirty());
        });
    }

    // ============================================
    // ACTION FUNCTIONS
    // ============================================

    let isDirty = false;

    function markDirty() {
        isDirty = true;
    }

    function collectPricingData() {
        const pricing = loadPricing();
        
        // Collect sale settings
        pricing.sale = {
            active: document.getElementById('saleActive')?.checked || false,
            name: document.getElementById('saleName')?.value || '',
            discount: parseInt(document.getElementById('saleDiscount')?.value) || 10,
            endDate: document.getElementById('saleEndDate')?.value || null
        };
        
        // Collect plans
        const plansContainer = document.getElementById('plansContainer');
        if (plansContainer) {
            plansContainer.querySelectorAll('.pricing-item').forEach((item, index) => {
                if (pricing.plans[index]) {
                    pricing.plans[index].name = item.querySelector('[data-field="name"]')?.value || pricing.plans[index].name;
                    pricing.plans[index].price = parseInt(item.querySelector('[data-field="price"]')?.value) || 0;
                    pricing.plans[index].setup = parseInt(item.querySelector('[data-field="setup"]')?.value) || 0;
                    pricing.plans[index].description = item.querySelector('[data-field="description"]')?.value || '';
                }
            });
        }
        
        // Collect GLAM plans
        const glamContainer = document.getElementById('glamPlansContainer');
        if (glamContainer) {
            glamContainer.querySelectorAll('.pricing-item').forEach((item, index) => {
                if (pricing.glamPlans[index]) {
                    pricing.glamPlans[index].name = item.querySelector('[data-field="name"]')?.value || pricing.glamPlans[index].name;
                    pricing.glamPlans[index].price = parseInt(item.querySelector('[data-field="price"]')?.value) || 0;
                    pricing.glamPlans[index].setup = parseInt(item.querySelector('[data-field="setup"]')?.value) || 0;
                    pricing.glamPlans[index].description = item.querySelector('[data-field="description"]')?.value || '';
                }
            });
        }
        
        // Collect tiered addons
        const tieredContainer = document.getElementById('tieredAddonsContainer');
        if (tieredContainer) {
            tieredContainer.querySelectorAll('.addon-category').forEach((cat, catIndex) => {
                if (pricing.tieredAddons[catIndex]) {
                    pricing.tieredAddons[catIndex].name = cat.querySelector('.addon-category-header [data-field="name"]')?.value || pricing.tieredAddons[catIndex].name;
                    
                    cat.querySelectorAll('.addon-tier').forEach((tier, tierIndex) => {
                        if (pricing.tieredAddons[catIndex].tiers[tierIndex]) {
                            pricing.tieredAddons[catIndex].tiers[tierIndex].name = tier.querySelector('[data-field="name"]')?.value || '';
                            pricing.tieredAddons[catIndex].tiers[tierIndex].price = parseInt(tier.querySelector('[data-field="price"]')?.value) || 0;
                            pricing.tieredAddons[catIndex].tiers[tierIndex].onetime = tier.querySelector('[data-field="onetime"]')?.checked || false;
                        }
                    });
                }
            });
        }
        
        // Collect flat addons
        const flatContainer = document.getElementById('flatAddonsContainer');
        if (flatContainer) {
            flatContainer.querySelectorAll('.pricing-item').forEach((item, index) => {
                if (pricing.flatAddons[index]) {
                    pricing.flatAddons[index].name = item.querySelector('[data-field="name"]')?.value || pricing.flatAddons[index].name;
                    pricing.flatAddons[index].price = parseInt(item.querySelector('[data-field="price"]')?.value) || 0;
                    pricing.flatAddons[index].onetime = item.querySelector('[data-field="onetime"]')?.checked || false;
                }
            });
        }
        
        // Collect business card pricing
        pricing.businessCards = {
            template: {
                single: {
                    qty100: parseInt(document.getElementById('bc_tpl_single_100')?.value) || 29,
                    qty250: parseInt(document.getElementById('bc_tpl_single_250')?.value) || 49,
                    qty1000: parseInt(document.getElementById('bc_tpl_single_1000')?.value) || 99
                },
                double: {
                    qty100: parseInt(document.getElementById('bc_tpl_double_100')?.value) || 39,
                    qty250: parseInt(document.getElementById('bc_tpl_double_250')?.value) || 69,
                    qty1000: parseInt(document.getElementById('bc_tpl_double_1000')?.value) || 129
                }
            },
            custom: {
                single: {
                    qty100: parseInt(document.getElementById('bc_cust_single_100')?.value) || 79,
                    qty250: parseInt(document.getElementById('bc_cust_single_250')?.value) || 99,
                    qty1000: parseInt(document.getElementById('bc_cust_single_1000')?.value) || 149
                },
                double: {
                    qty100: parseInt(document.getElementById('bc_cust_double_100')?.value) || 99,
                    qty250: parseInt(document.getElementById('bc_cust_double_250')?.value) || 129,
                    qty1000: parseInt(document.getElementById('bc_cust_double_1000')?.value) || 179
                }
            }
        };
        
        return pricing;
    }

    function saveAll() {
        const pricing = collectPricingData();
        if (savePricing(pricing)) {
            isDirty = false;
            alert('✓ Pricing saved successfully!\n\nChanges will appear on the Plans page.');
        } else {
            alert('Error saving pricing. Please try again.');
        }
    }

    function toggleSale() {
        markDirty();
    }

    function saveSale() {
        const pricing = collectPricingData();
        if (savePricing(pricing)) {
            alert(pricing.sale.active ? '✓ Sale is now ACTIVE!' : '✓ Sale settings saved (inactive)');
        }
    }

    function addPlan() {
        const pricing = loadPricing();
        const newId = 'plan_' + Date.now();
        pricing.plans.push({
            id: newId,
            name: 'New Plan',
            price: 0,
            setup: 0,
            featured: false,
            description: ''
        });
        savePricing(pricing);
        renderPlans(pricing.plans);
    }

    function addGlamPlan() {
        const pricing = loadPricing();
        const newId = 'glam_' + Date.now();
        pricing.glamPlans.push({
            id: newId,
            name: 'New GLAM Plan',
            price: 0,
            setup: 0,
            description: ''
        });
        savePricing(pricing);
        renderGlamPlans(pricing.glamPlans);
    }

    function deletePlan(type, index) {
        if (!confirm('Delete this plan?')) return;
        
        const pricing = loadPricing();
        if (type === 'plan') {
            pricing.plans.splice(index, 1);
            savePricing(pricing);
            renderPlans(pricing.plans);
        } else if (type === 'glam') {
            pricing.glamPlans.splice(index, 1);
            savePricing(pricing);
            renderGlamPlans(pricing.glamPlans);
        }
    }

    function toggleFeatured(type, index) {
        const pricing = collectPricingData();
        if (type === 'plan' && pricing.plans[index]) {
            // Only one can be featured
            pricing.plans.forEach((p, i) => p.featured = i === index ? !p.featured : false);
            savePricing(pricing);
            renderPlans(pricing.plans);
        }
    }

    function addAddonCategory() {
        const pricing = loadPricing();
        const newId = 'category_' + Date.now();
        pricing.tieredAddons.push({
            id: newId,
            name: 'New Category',
            tiers: [
                { id: newId + '_tier1', name: 'Basic', price: 0 }
            ]
        });
        savePricing(pricing);
        renderTieredAddons(pricing.tieredAddons);
    }

    function deleteCategory(catIndex) {
        if (!confirm('Delete this category and all its tiers?')) return;
        
        const pricing = loadPricing();
        pricing.tieredAddons.splice(catIndex, 1);
        savePricing(pricing);
        renderTieredAddons(pricing.tieredAddons);
    }

    function addTierToCategory(catIndex) {
        const pricing = collectPricingData();
        if (pricing.tieredAddons[catIndex]) {
            const newId = pricing.tieredAddons[catIndex].id + '_tier_' + Date.now();
            pricing.tieredAddons[catIndex].tiers.push({
                id: newId,
                name: 'New Tier',
                price: 0
            });
            savePricing(pricing);
            renderTieredAddons(pricing.tieredAddons);
        }
    }

    function deleteTier(catIndex, tierIndex) {
        const pricing = collectPricingData();
        if (pricing.tieredAddons[catIndex]?.tiers) {
            pricing.tieredAddons[catIndex].tiers.splice(tierIndex, 1);
            savePricing(pricing);
            renderTieredAddons(pricing.tieredAddons);
        }
    }

    function addFlatAddon() {
        const pricing = loadPricing();
        const newId = 'addon_' + Date.now();
        pricing.flatAddons.push({
            id: newId,
            name: 'New Add-on',
            price: 0,
            onetime: false
        });
        savePricing(pricing);
        renderFlatAddons(pricing.flatAddons);
    }

    function deleteFlatAddon(index) {
        if (!confirm('Delete this add-on?')) return;
        
        const pricing = loadPricing();
        pricing.flatAddons.splice(index, 1);
        savePricing(pricing);
        renderFlatAddons(pricing.flatAddons);
    }

    function resetToDefaults() {
        if (!confirm('Reset ALL pricing to defaults? This cannot be undone.')) return;
        
        savePricing(JSON.parse(JSON.stringify(DEFAULT_PRICING)));
        renderPricingTab();
        alert('✓ Pricing reset to defaults');
    }

    function exportPricing() {
        const pricing = collectPricingData();
        const blob = new Blob([JSON.stringify(pricing, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bossbooker-pricing-' + new Date().toISOString().split('T')[0] + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function importPricing() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const pricing = JSON.parse(ev.target.result);
                    if (pricing.plans && pricing.glamPlans) {
                        savePricing(pricing);
                        renderPricingTab();
                        alert('✓ Pricing imported successfully!');
                    } else {
                        alert('Invalid pricing file format');
                    }
                } catch (err) {
                    alert('Error reading file: ' + err.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    // ============================================
    // UTILITIES
    // ============================================

    function escHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ============================================
    // PUBLIC API FOR PLANS PAGE
    // ============================================

    function getPricing() {
        return loadPricing();
    }

    function getSale() {
        const pricing = loadPricing();
        if (pricing.sale.active) {
            // Check if sale has expired
            if (pricing.sale.endDate && new Date(pricing.sale.endDate) < new Date()) {
                pricing.sale.active = false;
                savePricing(pricing);
                return null;
            }
            return pricing.sale;
        }
        return null;
    }

    function applyDiscount(price, discount) {
        return Math.round(price * (1 - discount / 100));
    }

    // ============================================
    // EXPOSE TO GLOBAL
    // ============================================

    global.PricingAdmin = {
        // Admin functions
        render: renderPricingTab,
        saveAll,
        toggleSale,
        saveSale,
        addPlan,
        addGlamPlan,
        deletePlan,
        toggleFeatured,
        addAddonCategory,
        deleteCategory,
        addTierToCategory,
        deleteTier,
        addFlatAddon,
        deleteFlatAddon,
        resetToDefaults,
        exportPricing,
        importPricing,
        markDirty,
        
        // Public API for plans page
        getPricing,
        getSale,
        applyDiscount,
        DEFAULT_PRICING
    };

})(typeof window !== 'undefined' ? window : this);
