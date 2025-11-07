// Mobile Menu Toggle
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navMenu = document.getElementById('navMenu');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
    });

    // Close menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
        });
    });
}

// Sticky CTA
const stickyCta = document.getElementById('stickyCta');
let lastScroll = 0;

if (stickyCta) {
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 500) {
            stickyCta.classList.add('visible');
        } else {
            stickyCta.classList.remove('visible');
        }
        
        lastScroll = currentScroll;
    });
}

// Quiz Logic
const quizData = [
    {
        question: "What's the size of your business?",
        options: [
            { text: "Solo/Freelancer (just me)", value: "solo" },
            { text: "Small team (2-10 people)", value: "small" },
            { text: "Medium business (11-50 people)", value: "medium" },
            { text: "Large enterprise (50+ people)", value: "enterprise" }
        ]
    },
    {
        question: "How many appointments do you handle per month?",
        options: [
            { text: "Less than 50", value: "low" },
            { text: "50-200", value: "medium" },
            { text: "200-500", value: "high" },
            { text: "500+", value: "very-high" }
        ]
    },
    {
        question: "What features are most important to you?",
        options: [
            { text: "Basic scheduling and reminders", value: "basic" },
            { text: "Payment processing and invoicing", value: "payments" },
            { text: "Team management and analytics", value: "team" },
            { text: "Custom integrations and API access", value: "custom" }
        ]
    }
];

let currentQuestion = 0;
let quizAnswers = [];

const plans = {
    starter: {
        name: "Starter Plan",
        price: "$29/month",
        description: "Perfect for solo professionals and freelancers just getting started.",
        features: [
            "Up to 100 appointments/month",
            "Basic scheduling",
            "Email reminders",
            "Mobile-friendly booking page",
            "Calendar sync (Google, Apple)"
        ]
    },
    professional: {
        name: "Professional Plan",
        price: "$79/month",
        description: "Ideal for small teams and growing businesses.",
        features: [
            "Up to 500 appointments/month",
            "Advanced scheduling & automation",
            "SMS & email reminders",
            "Payment processing",
            "Team management (up to 10 users)",
            "Basic analytics & reporting",
            "Custom branding"
        ]
    },
    business: {
        name: "Business Plan",
        price: "$199/month",
        description: "For established businesses needing advanced features.",
        features: [
            "Unlimited appointments",
            "Advanced automation workflows",
            "Priority support",
            "Advanced analytics & insights",
            "Team management (up to 50 users)",
            "Custom integrations",
            "API access",
            "White-label options"
        ]
    },
    enterprise: {
        name: "Enterprise Plan",
        price: "Custom pricing",
        description: "Tailored solutions for large organizations.",
        features: [
            "Everything in Business",
            "Unlimited team members",
            "Dedicated account manager",
            "Custom development",
            "SLA guarantee",
            "Advanced security features",
            "On-premise deployment options",
            "Training & onboarding"
        ]
    }
};

function startQuiz() {
    currentQuestion = 0;
    quizAnswers = [];
    const quizModal = document.getElementById('quizModal');
    const quizStep = document.getElementById('quizStep');
    const quizResult = document.getElementById('quizResult');
    
    quizModal.classList.add('active');
    quizStep.classList.remove('hidden');
    quizResult.classList.add('hidden');
    
    showQuestion();
}

function closeQuiz() {
    const quizModal = document.getElementById('quizModal');
    quizModal.classList.remove('active');
}

function showQuestion() {
    const question = quizData[currentQuestion];
    const questionElement = document.getElementById('quizQuestion');
    const optionsElement = document.getElementById('quizOptions');
    
    questionElement.textContent = question.question;
    optionsElement.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'quiz-option';
        optionDiv.textContent = option.text;
        optionDiv.addEventListener('click', () => selectOption(option.value));
        optionsElement.appendChild(optionDiv);
    });
}

function selectOption(value) {
    quizAnswers.push(value);
    
    if (currentQuestion < quizData.length - 1) {
        currentQuestion++;
        showQuestion();
    } else {
        showResult();
    }
}

function showResult() {
    const quizStep = document.getElementById('quizStep');
    const quizResult = document.getElementById('quizResult');
    const resultContent = document.getElementById('resultContent');
    
    quizStep.classList.add('hidden');
    quizResult.classList.remove('hidden');
    
    // Simple recommendation logic
    let recommendedPlan;
    
    if (quizAnswers.includes('enterprise') || quizAnswers.includes('very-high')) {
        recommendedPlan = plans.enterprise;
    } else if (quizAnswers.includes('medium') || quizAnswers.includes('high') || quizAnswers.includes('team')) {
        recommendedPlan = plans.business;
    } else if (quizAnswers.includes('small') || quizAnswers.includes('medium') || quizAnswers.includes('payments')) {
        recommendedPlan = plans.professional;
    } else {
        recommendedPlan = plans.starter;
    }
    
    resultContent.innerHTML = `
        <div class="result-plan">${recommendedPlan.name}</div>
        <div class="result-description">${recommendedPlan.description}</div>
        <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary-color); margin: 1rem 0;">
            ${recommendedPlan.price}
        </div>
        <ul class="result-features">
            ${recommendedPlan.features.map(feature => `<li>${feature}</li>`).join('')}
        </ul>
    `;
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const quizModal = document.getElementById('quizModal');
    if (e.target === quizModal) {
        closeQuiz();
    }
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href.length > 1) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});
