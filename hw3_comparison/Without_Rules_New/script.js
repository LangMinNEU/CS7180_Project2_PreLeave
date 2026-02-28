document.addEventListener('DOMContentLoaded', () => {
    const loginToggle = document.getElementById('loginToggle');
    const signupToggle = document.getElementById('signupToggle');
    const toggleIndicator = document.getElementById('toggleIndicator');

    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const formsWrapper = document.getElementById('formsWrapper');

    // Function to resize wrapper to fit active form perfectly
    const resizeWrapper = (formElement) => {
        // Small delay to allow elements to render and compute height
        setTimeout(() => {
            formsWrapper.style.height = `${formElement.offsetHeight}px`;
            formsWrapper.style.transition = 'height 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        }, 10);
    };

    // Initialize height
    resizeWrapper(loginForm);

    loginToggle.addEventListener('click', () => {
        // Update Toggle Styles
        loginToggle.classList.add('active');
        signupToggle.classList.remove('active');
        toggleIndicator.style.transform = 'translateX(0)';

        // Update Forms
        loginForm.style.transform = 'translateX(0)';
        loginForm.style.opacity = '1';
        loginForm.style.pointerEvents = 'all';

        signupForm.style.transform = 'translateX(50px)';
        signupForm.style.opacity = '0';
        signupForm.style.pointerEvents = 'none';

        resizeWrapper(loginForm);
    });

    signupToggle.addEventListener('click', () => {
        // Update Toggle Styles
        signupToggle.classList.add('active');
        loginToggle.classList.remove('active');
        // The width of the toggle minus padding
        toggleIndicator.style.transform = 'translateX(100%)';

        // Update Forms
        signupForm.style.transform = 'translateX(0)';
        signupForm.style.opacity = '1';
        signupForm.style.pointerEvents = 'all';

        loginForm.style.transform = 'translateX(-50px)';
        loginForm.style.opacity = '0';
        loginForm.style.pointerEvents = 'none';

        resizeWrapper(signupForm);
    });

    // Handle form submissions to prevent reload and add visual feedback
    const setupFormSubmission = (formId) => {
        const form = document.getElementById(formId);
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = form.querySelector('.submit-btn');
            const originalHtml = btn.innerHTML;

            // Loading state
            btn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" class="spin-animation" style="width:20px;height:20px;animation:spin 1s linear infinite;">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="31.4 31.4" stroke-linecap="round"></circle>
                </svg>
                <span>Processing...</span>
            `;
            btn.style.opacity = '0.8';
            btn.style.pointerEvents = 'none';

            // Fake API call delay (showing off the UI)
            setTimeout(() => {
                btn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;">
                        <path d="M20 6L9 17l-5-5"></path>
                    </svg>
                    <span>Success!</span>
                `;
                btn.style.background = '#10b981'; // Success green
                btn.style.color = '#fff';

                // Reset after 2s
                setTimeout(() => {
                    btn.innerHTML = originalHtml;
                    btn.style = '';
                    form.reset();
                }, 2000);
            }, 1200);
        });
    };

    setupFormSubmission('loginForm');
    setupFormSubmission('signupForm');
});

// Add keyframes for spinner dynamically
const style = document.createElement('style');
style.innerHTML = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
