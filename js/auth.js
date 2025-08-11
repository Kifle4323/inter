document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');
    const loginFormContainer = document.getElementById('login-form-container');
    const registerFormContainer = document.getElementById('register-form-container');
    const registerUserType = document.getElementById('register-user-type');
    const studentExtraFields = document.getElementById('student-extra-fields');

    // Toggle visibility of extra student fields on registration form
    registerUserType.addEventListener('change', () => {
        if (registerUserType.value === 'student') {
            studentExtraFields.style.display = 'block';
        } else {
            studentExtraFields.style.display = 'none';
        }
    });

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

        const users = JSON.parse(localStorage.getItem('users')) || [];
        if (users.find(user => user.username === username)) {
            showNotification('Username already exists!', 'error');
            return;
        }

        let newUser = {
            username,
            password,
            userType,
            status: 'approved' // Supervisors are approved by default
        };

        if (userType === 'student') {
            const fullName = document.getElementById('register-fullname').value;
            const studentId = document.getElementById('register-studentid').value;
            const university = document.getElementById('register-university').value;
            const major = document.getElementById('register-major').value;
            const cvFile = document.getElementById('register-cv').files[0];

            if (!fullName || !studentId || !university || !major) {
                showNotification('Please fill out all student fields.', 'error');
                return;
            }

            newUser = {
                ...newUser,
                fullName,
                studentId,
                university,
                major,
                cv: cvFile ? cvFile.name : 'Not provided',
                status: 'pending'
            };
        }

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        if (userType === 'student') {
            showNotification('Registration successful! Your account is pending admin approval.');
        } else {
            showNotification('Registration successful! Please login.');
        }

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
            // Check if user is approved
            if (user.status === 'pending') {
                showNotification('Your account is pending approval from an administrator.', 'error');
                return;
            }

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
