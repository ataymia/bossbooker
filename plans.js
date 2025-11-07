// Plan selection
function selectPlan(planName) {
    alert(`You selected the ${planName} plan! This would normally redirect to the checkout page.`);
}

function contactSales() {
    window.location.href = 'contact.html?subject=Enterprise%20Plan';
}

// Price Calculator
function updatePrice() {
    // Get base plan
    const basePlanRadio = document.querySelector('input[name="basePlan"]:checked');
    const basePlanPrice = parseInt(basePlanRadio.dataset.price);
    const basePlanName = basePlanRadio.value.charAt(0).toUpperCase() + basePlanRadio.value.slice(1);
    
    let monthlyTotal = basePlanPrice;
    let onetimeTotal = 0;
    
    // Create summary details
    let summaryHTML = `
        <div class="summary-item">
            <span>Base Plan:</span>
            <span>${basePlanName} - $${basePlanPrice}</span>
        </div>
    `;
    
    // Get all checked add-ons
    const addons = document.querySelectorAll('input[type="checkbox"]:checked');
    addons.forEach(addon => {
        const price = parseInt(addon.dataset.price);
        const isOnetime = addon.dataset.onetime === 'true';
        const label = addon.parentElement.querySelector('span').textContent;
        
        if (isOnetime) {
            onetimeTotal += price;
            summaryHTML += `
                <div class="summary-item">
                    <span>${label.split(' - ')[0]}:</span>
                    <span>$${price} (one-time)</span>
                </div>
            `;
        } else {
            monthlyTotal += price;
            summaryHTML += `
                <div class="summary-item">
                    <span>${label.split(' - ')[0]}:</span>
                    <span>$${price}/mo</span>
                </div>
            `;
        }
    });
    
    // Get additional users
    const additionalUsers = document.getElementById('additionalUsers');
    const userCount = parseInt(additionalUsers.value) || 0;
    if (userCount > 0) {
        const userPrice = parseInt(additionalUsers.dataset.price) * userCount;
        monthlyTotal += userPrice;
        summaryHTML += `
            <div class="summary-item">
                <span>Additional Users (${userCount}):</span>
                <span>$${userPrice}/mo</span>
            </div>
        `;
    }
    
    // Update summary
    document.getElementById('summaryDetails').innerHTML = summaryHTML;
    document.getElementById('monthlyTotal').textContent = `$${monthlyTotal}`;
    document.getElementById('onetimeTotal').textContent = `$${onetimeTotal}`;
    document.getElementById('firstMonthTotal').textContent = `$${monthlyTotal + onetimeTotal}`;
    
    // Show/hide one-time row
    const onetimeRow = document.getElementById('onetimeRow');
    if (onetimeTotal > 0) {
        onetimeRow.style.display = 'flex';
    } else {
        onetimeRow.style.display = 'none';
    }
}

function proceedToCheckout() {
    const monthlyTotal = document.getElementById('monthlyTotal').textContent;
    const firstMonthTotal = document.getElementById('firstMonthTotal').textContent;
    alert(`Proceeding to checkout with:\nMonthly: ${monthlyTotal}\nFirst Month Total: ${firstMonthTotal}\n\nThis would normally redirect to the payment page.`);
}

// Initialize price on page load
document.addEventListener('DOMContentLoaded', () => {
    updatePrice();
});
