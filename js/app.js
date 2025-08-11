function showNotification(message, type = 'success') {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const alertType = type === 'error' ? 'danger' : 'success';
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
        <div class="alert alert-${alertType} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;

    container.appendChild(wrapper);

    // Automatically remove the alert after 5 seconds
    setTimeout(() => {
        const alert = wrapper.querySelector('.alert');
        if (alert) {
            // Use Bootstrap's alert instance to close it
            const bootstrapAlert = new bootstrap.Alert(alert);
            bootstrapAlert.close();
        }
    }, 5000);
}

// Mock data initialization
function initializeMockData() {
    // Mock internships
    if (!localStorage.getItem('internships')) {
        const internships = [
            { studentUsername: 'student1', company: 'Tech Corp', position: 'Software Engineer Intern', supervisor: 'supervisor1' },
            { studentUsername: 'student2', company: 'Web Inc.', position: 'Frontend Developer Intern', supervisor: 'supervisor2' }
        ];
        localStorage.setItem('internships', JSON.stringify(internships));
    }
    // Mock reports (can be empty initially)
    if (!localStorage.getItem('reports')) {
        localStorage.setItem('reports', JSON.stringify([]));
    }
}

initializeMockData();


document.addEventListener('DOMContentLoaded', () => {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    const navbar = document.getElementById('navbar');

    // If no user is logged in, redirect to the login page
    // This check should not run on the login page itself, which doesn't have a navbar.
    if (!loggedInUser && navbar) {
        window.location.href = 'index.html';
        return;
    }

    if (navbar) {
        navbar.classList.add('navbar', 'navbar-expand-lg', 'navbar-dark', 'bg-dark');
        let navLinks = `
            <div class="container-fluid">
                <a class="navbar-brand" href="#">IMS</a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav me-auto">
                        <li class="nav-item">
                            <a class="nav-link" href="${loggedInUser.userType}_dashboard.html">Dashboard</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="profile.html">Profile</a>
                        </li>
                    </ul>
                    <ul class="navbar-nav">
                        <li class="nav-item">
                            <a class="nav-link" href="#" id="logout">Logout</a>
                        </li>
                    </ul>
                </div>
            </div>
        `;
        navbar.innerHTML = navLinks;

        const logoutButton = document.getElementById('logout');
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('loggedInUser');
            window.location.href = 'index.html';
        });
    }

    // Profile page logic
    if (window.location.pathname.endsWith('profile.html')) {
        const profileUsername = document.getElementById('profile-username');
        const profileUserType = document.getElementById('profile-user-type');
        const updateProfileForm = document.getElementById('update-profile-form');

        if (loggedInUser) {
            profileUsername.textContent = loggedInUser.username;
            profileUserType.textContent = loggedInUser.userType;
        }

        updateProfileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('update-password').value;

            if (!newPassword) {
                showNotification('Please enter a new password.', 'error');
                return;
            }

            // Update password in localStorage
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const userIndex = users.findIndex(u => u.username === loggedInUser.username);

            if (userIndex > -1) {
                users[userIndex].password = newPassword;
                localStorage.setItem('users', JSON.stringify(users));

                // Also update the session storage if you want the change to be reflected immediately
                loggedInUser.password = newPassword;
                sessionStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));

                showNotification('Password updated successfully!');
                updateProfileForm.reset();
            }
        });
    }

    // Student Dashboard Logic
    if (window.location.pathname.endsWith('student_dashboard.html')) {
        const studentName = document.getElementById('student-name');
        const internshipInfo = document.getElementById('internship-info');
        const reportForm = document.getElementById('report-form');
        const reportsList = document.getElementById('reports-list');

        if (loggedInUser) {
            studentName.textContent = loggedInUser.username;
            loadInternshipDetails();
            loadReports();
        }

        function loadInternshipDetails() {
            const internships = JSON.parse(localStorage.getItem('internships')) || [];
            const myInternship = internships.find(i => i.studentUsername === loggedInUser.username);

            if (myInternship) {
                internshipInfo.innerHTML = `
                    <p><strong>Company:</strong> ${myInternship.company}</p>
                    <p><strong>Position:</strong> ${myInternship.position}</p>
                    <p><strong>Supervisor:</strong> ${myInternship.supervisor}</p>
                `;
            } else {
                internshipInfo.innerHTML = '<p>Your internship has not been assigned yet.</p>';
            }
        }

        function loadReports() {
            const reports = JSON.parse(localStorage.getItem('reports')) || [];
            const myReports = reports.filter(r => r.studentUsername === loggedInUser.username);

            if (myReports.length > 0) {
                reportsList.innerHTML = '<div class="list-group">' + myReports.map(report => `
                    <div class="list-group-item list-group-item-action">
                        <div class="d-flex w-100 justify-content-between">
                            <h5 class="mb-1">${report.title}</h5>
                            <small>${new Date(report.timestamp).toLocaleDateString()}</small>
                        </div>
                        <p class="mb-1">${report.content}</p>
                        <hr>
                        <p class="mb-1"><strong>Feedback:</strong> ${report.feedback || '<em>No feedback yet.</em>'}</p>
                    </div>
                `).join('') + '</div>';
            } else {
                reportsList.innerHTML = '<div class="alert alert-info">No reports submitted yet.</div>';
            }
        }

        reportForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('report-title').value;
            const content = document.getElementById('report-content').value;
            const reports = JSON.parse(localStorage.getItem('reports')) || [];

            const newReport = {
                id: Date.now(), // simple unique id
                studentUsername: loggedInUser.username,
                title,
                content,
                timestamp: new Date(),
                feedback: null
            };

            reports.push(newReport);
            localStorage.setItem('reports', JSON.stringify(reports));

            showNotification('Report submitted successfully!');
            reportForm.reset();
            loadReports(); // Refresh the list
        });
    }

    // Supervisor Dashboard Logic
    if (window.location.pathname.endsWith('supervisor_dashboard.html')) {
        const supervisorName = document.getElementById('supervisor-name');
        const studentsList = document.getElementById('students-list');
        const reportsContainer = document.getElementById('student-reports-container');

        if (loggedInUser) {
            supervisorName.textContent = loggedInUser.username;
            loadAssignedStudents();
        }

        function loadAssignedStudents() {
            const internships = JSON.parse(localStorage.getItem('internships')) || [];
            const myStudents = internships.filter(i => i.supervisor === loggedInUser.username);

            if (myStudents.length > 0) {
                studentsList.innerHTML = myStudents.map(student =>
                    `<a href="#" class="list-group-item list-group-item-action student-link" data-student="${student.studentUsername}">${student.studentUsername}</a>`
                ).join('');

                document.querySelectorAll('.student-link').forEach(link => {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        // Optional: highlight the active student
                        document.querySelectorAll('.student-link').forEach(l => l.classList.remove('active'));
                        e.target.classList.add('active');
                        loadStudentReports(e.target.dataset.student);
                    });
                });
            } else {
                studentsList.innerHTML = '<div class="list-group-item">You have no students assigned to you.</div>';
            }
        }

        function loadStudentReports(studentUsername) {
            reportsContainer.innerHTML = `<h4 class="mb-3">Reports for ${studentUsername}</h4>`;
            const reports = JSON.parse(localStorage.getItem('reports')) || [];
            const studentReports = reports.filter(r => r.studentUsername === studentUsername);

            if (studentReports.length > 0) {
                reportsContainer.innerHTML += '<div class="accordion" id="reportsAccordion">' + studentReports.map((report, index) => `
                    <div class="accordion-item">
                        <h2 class="accordion-header" id="heading${report.id}">
                            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${report.id}" aria-expanded="false" aria-controls="collapse${report.id}">
                                ${report.title} - <small class="ms-2">Submitted on: ${new Date(report.timestamp).toLocaleDateString()}</small>
                            </button>
                        </h2>
                        <div id="collapse${report.id}" class="accordion-collapse collapse" aria-labelledby="heading${report.id}" data-bs-parent="#reportsAccordion">
                            <div class="accordion-body">
                                <p>${report.content}</p>
                                <hr>
                                <form class="feedback-form" data-report-id="${report.id}">
                                    <div class="mb-3">
                                        <label class="form-label"><strong>Feedback</strong></label>
                                        <textarea class="form-control" name="feedback" rows="3" placeholder="Provide feedback...">${report.feedback || ''}</textarea>
                                    </div>
                                    <button type="submit" class="btn btn-sm btn-success">Save Feedback</button>
                                </form>
                            </div>
                        </div>
                    </div>
                `).join('') + '</div>';

                document.querySelectorAll('.feedback-form').forEach(form => {
                    form.addEventListener('submit', saveFeedback);
                });
            } else {
                reportsContainer.innerHTML += '<div class="alert alert-secondary">This student has not submitted any reports.</div>';
            }
        }

        function saveFeedback(e) {
            e.preventDefault();
            const reportId = e.target.dataset.reportId;
            const feedbackText = e.target.querySelector('textarea').value;
            const reports = JSON.parse(localStorage.getItem('reports')) || [];
            const reportIndex = reports.findIndex(r => r.id == reportId);

            if (reportIndex > -1) {
                reports[reportIndex].feedback = feedbackText;
                localStorage.setItem('reports', JSON.stringify(reports));
                showNotification('Feedback saved successfully!');
            }
        }
    }

    // Admin Dashboard Logic
    if (window.location.pathname.endsWith('admin_dashboard.html')) {
        const adminName = document.getElementById('admin-name');
        const usersContainer = document.getElementById('users-container');
        const addUserForm = document.getElementById('add-user-form');
        const internshipsContainer = document.getElementById('internships-container');
        const addInternshipForm = document.getElementById('add-internship-form');
        const studentSelect = document.getElementById('student-select');
        const supervisorSelect = document.getElementById('supervisor-select');

        if (loggedInUser) {
            adminName.textContent = loggedInUser.username;
            loadAllData();
        }

        function loadAllData() {
            loadUsers();
            loadInternships();
            populateSelects();
        }

        function loadUsers() {
            const users = JSON.parse(localStorage.getItem('users')) || [];
            if (users.filter(u => u.userType !== 'admin').length === 0) {
                usersContainer.innerHTML = '<div class="alert alert-info">No students or supervisors found.</div>';
                return;
            }
            usersContainer.innerHTML = '<table class="table table-striped table-hover"><thead><tr><th>Username</th><th>Type</th><th class="text-end">Action</th></tr></thead><tbody>' +
                users.filter(u => u.userType !== 'admin').map(user => `
                    <tr>
                        <td>${user.username}</td>
                        <td><span class="badge bg-secondary">${user.userType}</span></td>
                        <td class="text-end"><button class="btn btn-danger btn-sm delete-user" data-username="${user.username}">Delete</button></td>
                    </tr>
                `).join('') + '</tbody></table>';

            document.querySelectorAll('.delete-user').forEach(button => {
                button.addEventListener('click', (e) => {
                    if (confirm('Are you sure you want to delete this user? This will also remove their internship assignment.')) {
                        deleteUser(e.target.dataset.username);
                    }
                });
            });
        }

        function loadInternships() {
            const internships = JSON.parse(localStorage.getItem('internships')) || [];
            if (internships.length === 0) {
                internshipsContainer.innerHTML = '<div class="alert alert-info">No internships assigned yet.</div>';
                return;
            }
            internshipsContainer.innerHTML = '<table class="table table-striped table-hover"><thead><tr><th>Student</th><th>Company</th><th>Position</th><th>Supervisor</th><th class="text-end">Action</th></tr></thead><tbody>' +
                internships.map(internship => `
                    <tr>
                        <td>${internship.studentUsername}</td>
                        <td>${internship.company}</td>
                        <td>${internship.position}</td>
                        <td>${internship.supervisor}</td>
                        <td class="text-end"><button class="btn btn-danger btn-sm delete-internship" data-student="${internship.studentUsername}">Delete</button></td>
                    </tr>
                `).join('') + '</tbody></table>';

            document.querySelectorAll('.delete-internship').forEach(button => {
                button.addEventListener('click', (e) => {
                    if (confirm('Are you sure you want to delete this internship?')) {
                        deleteInternship(e.target.dataset.student);
                    }
                });
            });
        }

        function populateSelects() {
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const internships = JSON.parse(localStorage.getItem('internships')) || [];
            const assignedStudents = internships.map(i => i.studentUsername);

            const availableStudents = users.filter(u => u.userType === 'student' && !assignedStudents.includes(u.username));
            const supervisors = users.filter(u => u.userType === 'supervisor');

            studentSelect.innerHTML = '<option value="">Select Student</option>' + availableStudents.map(s => `<option value="${s.username}">${s.username}</option>`).join('');
            supervisorSelect.innerHTML = '<option value="">Select Supervisor</option>' + supervisors.map(s => `<option value="${s.username}">${s.username}</option>`).join('');
        }

        addUserForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('new-username').value;
            const password = document.getElementById('new-password').value;
            const userType = document.getElementById('new-user-type').value;
            let users = JSON.parse(localStorage.getItem('users')) || [];

            if (users.find(u => u.username === username)) {
                showNotification('Username already exists.', 'error');
                return;
            }

            users.push({ username, password, userType });
            localStorage.setItem('users', JSON.stringify(users));
            showNotification('User added successfully!');
            addUserForm.reset();
            loadAllData();
        });

        addInternshipForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const studentUsername = studentSelect.value;
            const company = document.getElementById('internship-company').value;
            const position = document.getElementById('internship-position').value;
            const supervisor = supervisorSelect.value;
            let internships = JSON.parse(localStorage.getItem('internships')) || [];

            if (internships.find(i => i.studentUsername === studentUsername)) {
                showNotification('This student already has an internship assigned.', 'error');
                return;
            }

            internships.push({ studentUsername, company, position, supervisor });
            localStorage.setItem('internships', JSON.stringify(internships));
            showNotification('Internship assigned successfully!');
            addInternshipForm.reset();
            loadAllData();
        });

        function deleteUser(username) {
            let users = JSON.parse(localStorage.getItem('users')) || [];
            users = users.filter(u => u.username !== username);
            localStorage.setItem('users', JSON.stringify(users));
            deleteInternship(username); // Also delete their internship
            loadAllData();
        }

        function deleteInternship(studentUsername) {
            let internships = JSON.parse(localStorage.getItem('internships')) || [];
            internships = internships.filter(i => i.studentUsername !== studentUsername);
            localStorage.setItem('internships', JSON.stringify(internships));
            loadAllData();
        }
    }
});
