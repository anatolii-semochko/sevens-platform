// Registration form - Password toggle functionality
// Only affects registration page

document.addEventListener('DOMContentLoaded', function() {
    const toggleButtons = document.querySelectorAll('.registration-page .password-toggle');

    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);
            const showIcon = this.querySelector('[data-show-icon]');
            const hideIcon = this.querySelector('[data-hide-icon]');

            if (!passwordInput) {
                console.error('Password input not found:', targetId);
                return;
            }

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                showIcon.classList.add('d-none');
                hideIcon.classList.remove('d-none');
            } else {
                passwordInput.type = 'password';
                showIcon.classList.remove('d-none');
                hideIcon.classList.add('d-none');
            }
        });
    });
});