document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');
    const loginFormContainer = document.getElementById('login-form-container');
    const registerFormContainer = document.getElementById('register-form-container');

    // Toggle between login and register forms
    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginFormContainer.style.display = 'none';
        registerFormContainer.style.display = 'block';
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        loginFormContainer.style.display = 'block';
        registerFormContainer.style.display = 'none';
    });

    // Registration logic
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        const userType = document.getElementById('register-user-type').value;

        // In a real app, you'd send this to a server.
        // For now, we'll use localStorage.
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const existingUser = users.find(user => user.username === username);

        if (existingUser) {
            showNotification('Username already exists!', 'error');
            return;
        }

        users.push({ username, password, userType });
        localStorage.setItem('users', JSON.stringify(users));
        showNotification('Registration successful! Please login.');
        showLogin.click();
        registerForm.reset();
    });

    // Login logic
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const userType = document.getElementById('login-user-type').value;

        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.username === username && u.password === password && u.userType === userType);

        if (user) {
            // Store session info
            sessionStorage.setItem('loggedInUser', JSON.stringify(user));

            // Redirect to the correct dashboard
            switch (user.userType) {
                case 'student':
                    window.location.href = 'student_dashboard.html';
                    break;
                case 'supervisor':
                    window.location.href = 'supervisor_dashboard.html';
                    break;
                case 'admin':
                    window.location.href = 'admin_dashboard.html';
                    break;
                default:
                    showNotification('Invalid user type!', 'error');
            }
        } else {
            showNotification('Invalid username, password, or user type.', 'error');
        }
    });
});
