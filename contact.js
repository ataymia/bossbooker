// Contact form handling
document.getElementById('contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // In a real application, this would send data to a server
    console.log('Form submitted:', data);
    
    // Show success message
    const successMessage = document.getElementById('formSuccess');
    successMessage.classList.remove('hidden');
    
    // Reset form
    e.target.reset();
    
    // Scroll to success message
    successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Hide success message after 5 seconds
    setTimeout(() => {
        successMessage.classList.add('hidden');
    }, 5000);
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
