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
    
    // Helper function to create a summary item safely
    function createSummaryItem(label, value) {
        const div = document.createElement('div');
        div.className = 'summary-item';
        
        const labelSpan = document.createElement('span');
        labelSpan.textContent = label;
        
        const valueSpan = document.createElement('span');
        valueSpan.textContent = value;
        
        div.appendChild(labelSpan);
        div.appendChild(valueSpan);
        return div;
    }
    
    // Clear and rebuild summary details
    const summaryDetails = document.getElementById('summaryDetails');
    summaryDetails.innerHTML = ''; // Clear existing content
    
    // Add base plan
    summaryDetails.appendChild(createSummaryItem('Base Plan:', `${basePlanName} - $${basePlanPrice}`));
    
    // Get all checked add-ons
    const addons = document.querySelectorAll('input[type="checkbox"]:checked');
    addons.forEach(addon => {
        const price = parseInt(addon.dataset.price);
        const isOnetime = addon.dataset.onetime === 'true';
        const label = addon.parentElement.querySelector('span').textContent;
        const labelName = label.split(' - ')[0];
        
        if (isOnetime) {
            onetimeTotal += price;
            summaryDetails.appendChild(createSummaryItem(labelName + ':', `$${price} (one-time)`));
        } else {
            monthlyTotal += price;
            summaryDetails.appendChild(createSummaryItem(labelName + ':', `$${price}/mo`));
        }
    });
    
    // Get additional users
    const additionalUsers = document.getElementById('additionalUsers');
    const userCount = parseInt(additionalUsers.value) || 0;
    if (userCount > 0) {
        const userPrice = parseInt(additionalUsers.dataset.price) * userCount;
        monthlyTotal += userPrice;
        summaryDetails.appendChild(createSummaryItem(`Additional Users (${userCount}):`, `$${userPrice}/mo`));
    }
    
    // Update totals
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
    
    // In a real application, this would redirect to the payment page
    // For now, we'll show a simple confirmation
    const confirmMsg = `Ready to proceed to checkout!\n\nMonthly: ${monthlyTotal}\nFirst Month Total: ${firstMonthTotal}\n\nIn a production environment, you would be redirected to the payment page.`;
    
    // Show confirmation in console for debugging
    if (window.console && console.log) {
        console.log('Checkout initiated:', { monthlyTotal, firstMonthTotal });
    }
    
    alert(confirmMsg);
}

// Initialize price on page load
document.addEventListener('DOMContentLoaded', () => {
    updatePrice();
});
