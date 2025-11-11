// Contact form handling
document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(e.target);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        company: formData.get('company') || '',
        phone: formData.get('phone') || '',
        message: formData.get('message') || '',
    };
    
    // Try to save to Cloudflare Worker API first
    let success = false;
    if (window.API_CONFIG && !window.API_CONFIG.USE_LOCALSTORAGE_FALLBACK) {
        try {
            const response = await fetch(`${window.API_CONFIG.WORKER_URL}${window.API_CONFIG.ENDPOINTS.CONTACT}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
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
            const localData = {
                id: 'contact_' + Date.now(),
                ...data,
                timestamp: Date.now(),
                status: 'new'
            };
            const contacts = JSON.parse(localStorage.getItem('bossbooker_contacts') || '[]');
            contacts.unshift(localData);
            localStorage.setItem('bossbooker_contacts', JSON.stringify(contacts));
            success = true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }
    
    // Show success message
    if (success) {
        alert('Thank you for contacting us! We\'ll get back to you within 1 business day at bossbookerinfo@gmail.com');
        e.target.reset();
    } else {
        alert('Sorry, there was an error submitting your request. Please try again or email us directly at bossbookerinfo@gmail.com');
    }
});

// Pre-fill subject from URL parameter (e.g., from Enterprise plan contact)
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const subject = urlParams.get('subject');
    
    if (subject) {
        const subjectSelect = document.getElementById('subject');
        // Try to match the subject parameter to an option value
        const options = Array.from(subjectSelect.options);
        const matchingOption = options.find(opt => 
            opt.textContent.toLowerCase().includes(subject.toLowerCase()) ||
            opt.value.toLowerCase().includes(subject.toLowerCase())
        );
        
        if (matchingOption) {
            subjectSelect.value = matchingOption.value;
        }
    }
});
