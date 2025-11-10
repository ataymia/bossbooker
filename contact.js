// Contact form handling
document.getElementById('contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(e.target);
    const data = {
        id: 'contact_' + Date.now(),
        name: formData.get('name'),
        email: formData.get('email'),
        company: formData.get('company') || '',
        phone: formData.get('phone') || '',
        message: formData.get('message') || '',
        timestamp: Date.now(),
        status: 'new'
    };
    
    // Save to localStorage for admin portal
    try {
        const contacts = JSON.parse(localStorage.getItem('bossbooker_contacts') || '[]');
        contacts.unshift(data); // Add to beginning
        localStorage.setItem('bossbooker_contacts', JSON.stringify(contacts));
    } catch (error) {
        console.error('Error saving contact:', error);
    }
    
    // Show success message
    alert('Thank you for contacting us! We\'ll get back to you within 1 business day at bossbookerinfo@gmail.com');
    
    // Reset form
    e.target.reset();
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
