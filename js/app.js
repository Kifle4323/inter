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
    // Mock reports (can be empty initially)
    if (!localStorage.getItem('reports')) {
        localStorage.setItem('reports', JSON.stringify([]));
    }
    // Mock projects
    if (!localStorage.getItem('projects')) {
        localStorage.setItem('projects', JSON.stringify([]));
    }
    // Mock attendance
    if (!localStorage.getItem('attendance')) {
        localStorage.setItem('attendance', JSON.stringify([]));
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
        const reportForm = document.getElementById('report-form');
        const reportsList = document.getElementById('reports-list');
        const reportSubmissionCard = document.getElementById('report-submission-card');
        const projectStatusContainer = document.getElementById('project-status-container');
        const availableProjectsContainer = document.getElementById('available-projects-container');

        if (loggedInUser) {
            studentName.textContent = loggedInUser.username;
            loadSupervisorInfo();
            loadStudentProjectView();
            loadReports();
            loadStudentAttendanceHistory(); // Add this call
        }

        function loadSupervisorInfo() {
            const container = document.getElementById('supervisor-info-container');
            if (loggedInUser && loggedInUser.supervisor) {
                container.innerHTML = `<p class="mb-0">Your assigned supervisor is <strong>${loggedInUser.supervisor}</strong>.</p>`;
            } else {
                container.innerHTML = `<p class="mb-0 text-muted">Not yet assigned.</p>`;
            }
        }

        function loadStudentProjectView() {
            const projects = JSON.parse(localStorage.getItem('projects')) || [];
            const myProject = projects.find(p => p.assignedTo === loggedInUser.username || p.pendingStudent === loggedInUser.username);

            if (myProject) {
                // Student has a project (either pending or approved)
                availableProjectsContainer.style.display = 'none';
                loadProjectStatus();
                if(myProject.status === 'in_progress') {
                    reportSubmissionCard.style.display = 'block';
                }
            } else {
                // Student has no project, show available projects
                loadAvailableProjects();
                projectStatusContainer.innerHTML = '<div class="alert alert-info">Apply for a project to get started.</div>';
                reportSubmissionCard.style.display = 'none';
            }
        }

        function loadAvailableProjects() {
            const projects = JSON.parse(localStorage.getItem('projects')) || [];
            const availableProjects = projects.filter(p => p.status === 'available');

            if (availableProjects.length === 0) {
                availableProjectsContainer.innerHTML = '<div class="alert alert-secondary">No projects are available at this time.</div>';
                return;
            }

            availableProjectsContainer.innerHTML = availableProjects.map(project => `
                <div class="card mb-3">
                    <div class="card-body">
                        <h5 class="card-title">${project.title}</h5>
                        <p class="card-text">${project.description}</p>
                        <button class="btn btn-primary apply-project" data-id="${project.id}">Apply</button>
                    </div>
                </div>
            `).join('');

            document.querySelectorAll('.apply-project').forEach(button => {
                button.addEventListener('click', (e) => handleProjectApplication(e.target.dataset.id));
            });
        }

        function handleProjectApplication(projectId) {
            let projects = JSON.parse(localStorage.getItem('projects')) || [];
            const projectIndex = projects.findIndex(p => p.id == projectId);

            if (projectIndex > -1) {
                projects[projectIndex].status = 'pending_approval';
                projects[projectIndex].pendingStudent = loggedInUser.username;
                localStorage.setItem('projects', JSON.stringify(projects));
                showNotification('Application submitted successfully! Waiting for admin approval.');
                loadStudentProjectView(); // Refresh the view
            }
        }

        function loadProjectStatus() {
            const projects = JSON.parse(localStorage.getItem('projects')) || [];
            const myProject = projects.find(p => p.assignedTo === loggedInUser.username || p.pendingStudent === loggedInUser.username);

            if (myProject) {
                let statusBadge;
                if (myProject.status === 'in_progress') statusBadge = 'bg-primary';
                else if (myProject.status === 'pending_approval') statusBadge = 'bg-warning text-dark';
                else if (myProject.status === 'completed') statusBadge = 'bg-success';
                else statusBadge = 'bg-secondary';

                projectStatusContainer.innerHTML = `
                    <h5>${myProject.title}</h5>
                    <p><strong>Status:</strong> <span class="badge ${statusBadge}">${myProject.status.replace('_', ' ')}</span></p>
                    <div class="progress" role="progressbar" aria-valuenow="${myProject.progress}" aria-valuemin="0" aria-valuemax="100">
                        <div class="progress-bar" style="width: ${myProject.progress}%">${myProject.progress}%</div>
                    </div>
                `;
            } else {
                 projectStatusContainer.innerHTML = '<div class="alert alert-info">Apply for a project to get started.</div>';
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

        function loadStudentAttendanceHistory() {
            const container = document.getElementById('student-attendance-history-container');
            const attendanceRecords = JSON.parse(localStorage.getItem('attendance')) || [];
            const myAttendance = attendanceRecords.filter(a => a.studentUsername === loggedInUser.username);

            if (myAttendance.length === 0) {
                container.innerHTML = '<p>No attendance records found.</p>';
                return;
            }

            container.innerHTML = '<table class="table table-sm table-striped"><thead><tr><th>Date</th><th>Status</th></tr></thead><tbody>' +
                myAttendance.map(rec => {
                    const statusClass = rec.status === 'Present' ? 'text-success' : 'text-danger';
                    return `<tr><td>${rec.date}</td><td class="fw-bold ${statusClass}">${rec.status}</td></tr>`
                }).join('') +
                '</tbody></table>';
        }
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
            const projects = JSON.parse(localStorage.getItem('projects')) || [];
            const myStudentsProjects = projects.filter(p => p.supervisor === loggedInUser.username && p.status === 'in_progress');
            const myStudents = [...new Set(myStudentsProjects.map(p => p.assignedTo))]; // Get unique student usernames

            if (myStudents.length > 0) {
                studentsList.innerHTML = myStudents.map(studentUsername =>
                    `<a href="#" class="list-group-item list-group-item-action student-link" data-student="${studentUsername}">${studentUsername}</a>`
                ).join('');

                document.querySelectorAll('.student-link').forEach(link => {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        // Optional: highlight the active student
                        document.querySelectorAll('.student-link').forEach(l => l.classList.remove('active'));
                        e.target.classList.add('active');
                        document.getElementById('student-details-content').innerHTML = `
                            <div id="student-project-details-container" class="mb-4"></div>
                            <div id="student-attendance-container" class="mb-4"></div>
                            <div id="student-reports-container"></div>
                        `; // Clear the initial message and reset containers
                        loadStudentReports(e.target.dataset.student);
                    });
                });
            } else {
                studentsList.innerHTML = '<div class="list-group-item">You have no students assigned to you.</div>';
            }
        }

        function loadStudentReports(studentUsername) {
            loadStudentProjectDetails(studentUsername); // New function call
            loadAttendance(studentUsername); // Add this call

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

        function loadStudentProjectDetails(studentUsername) {
            const projects = JSON.parse(localStorage.getItem('projects')) || [];
            const project = projects.find(p => p.assignedTo === studentUsername);
            const container = document.getElementById('student-project-details-container');

            if (!project || project.status !== 'in_progress') {
                container.innerHTML = '';
                return;
            }

            let completeButton = '';
            if (project.progress == 100) {
                completeButton = `<button class="btn btn-warning mt-2" id="request-completion-btn" data-id="${project.id}">Request Completion Approval</button>`;
            }

            container.innerHTML = `
                <div class="card">
                    <div class="card-header"><h3 class="h5 mb-0">Project Progress: ${project.title}</h3></div>
                    <div class="card-body">
                        <form id="progress-update-form" data-id="${project.id}">
                            <label for="progress-range" class="form-label">Progress: <span id="progress-value">${project.progress}</span>%</label>
                            <input type="range" class="form-range" min="0" max="100" value="${project.progress}" id="progress-range">
                            <button type="submit" class="btn btn-primary btn-sm">Update Progress</button>
                            ${completeButton}
                        </form>
                    </div>
                </div>
            `;

            const rangeInput = document.getElementById('progress-range');
            const progressValue = document.getElementById('progress-value');
            rangeInput.addEventListener('input', () => {
                progressValue.textContent = rangeInput.value;
            });

            document.getElementById('progress-update-form').addEventListener('submit', (e) => {
                e.preventDefault();
                updateProjectProgress(e.target.dataset.id, rangeInput.value);
            });

            if (project.progress == 100) {
                document.getElementById('request-completion-btn').addEventListener('click', (e) => {
                    requestCompletion(e.target.dataset.id);
                });
            }
        }

        function updateProjectProgress(projectId, progress) {
            let projects = JSON.parse(localStorage.getItem('projects')) || [];
            const projectIndex = projects.findIndex(p => p.id == projectId);

            if (projectIndex > -1) {
                projects[projectIndex].progress = progress;
                localStorage.setItem('projects', JSON.stringify(projects));
                showNotification('Progress updated successfully!');
                loadStudentProjectDetails(projects[projectIndex].assignedTo); // Refresh the view
            }
        }

        function requestCompletion(projectId) {
            let projects = JSON.parse(localStorage.getItem('projects')) || [];
            const projectIndex = projects.findIndex(p => p.id == projectId);

            if (projectIndex > -1) {
                projects[projectIndex].status = 'pending_completion_approval';
                localStorage.setItem('projects', JSON.stringify(projects));
                showNotification('Project marked as complete. Awaiting admin approval.');
                loadStudentProjectDetails(projects[projectIndex].assignedTo);
                document.getElementById('student-project-details-container').innerHTML = ''; // Hide after action
            }
        }

        function loadAttendance(studentUsername) {
            const container = document.getElementById('student-attendance-container');
            const attendanceRecords = JSON.parse(localStorage.getItem('attendance')) || [];
            const studentAttendance = attendanceRecords.filter(a => a.studentUsername === studentUsername);

            let historyTable = '<p>No attendance records yet.</p>';
            if (studentAttendance.length > 0) {
                historyTable = '<table class="table table-sm table-striped"><thead><tr><th>Date</th><th>Status</th></tr></thead><tbody>' +
                studentAttendance.map(rec => `<tr><td>${rec.date}</td><td>${rec.status}</td></tr>`).join('') +
                '</tbody></table>';
            }

            container.innerHTML = `
                <div class="card">
                    <div class="card-header"><h3 class="h5 mb-0">Manage Attendance</h3></div>
                    <div class="card-body">
                        <form id="attendance-form" data-student="${studentUsername}">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="attendance-date" class="form-label">Date</label>
                                    <input type="date" class="form-control" id="attendance-date" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="attendance-status" class="form-label">Status</label>
                                    <select class="form-select" id="attendance-status">
                                        <option value="Present">Present</option>
                                        <option value="Absent">Absent</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-secondary btn-sm">Mark Attendance</button>
                        </form>
                        <hr>
                        <h5>Attendance History</h5>
                        ${historyTable}
                    </div>
                </div>
            `;

            document.getElementById('attendance-form').addEventListener('submit', handleMarkAttendance);
        }

        function handleMarkAttendance(e) {
            e.preventDefault();
            const studentUsername = e.target.dataset.student;
            const date = document.getElementById('attendance-date').value;
            const status = document.getElementById('attendance-status').value;

            if (!date) {
                showNotification('Please select a date.', 'error');
                return;
            }

            let attendanceRecords = JSON.parse(localStorage.getItem('attendance')) || [];
            // Optional: check for duplicate entry for the same student on the same date
            const existingRecord = attendanceRecords.findIndex(rec => rec.studentUsername === studentUsername && rec.date === date);
            if (existingRecord > -1) {
                attendanceRecords[existingRecord].status = status; // Update existing
            } else {
                attendanceRecords.push({ studentUsername, date, status });
            }

            localStorage.setItem('attendance', JSON.stringify(attendanceRecords));
            showNotification('Attendance marked successfully.');
            loadAttendance(studentUsername); // Refresh attendance view
        }
    }

    // Admin Dashboard Logic
    if (window.location.pathname.endsWith('admin_dashboard.html')) {
        const adminName = document.getElementById('admin-name');
        const usersContainer = document.getElementById('users-container');
        const addUserForm = document.getElementById('add-user-form');
        // const internshipsContainer = document.getElementById('internships-container'); // Obsolete
        // const addInternshipForm = document.getElementById('add-internship-form'); // Obsolete
        // const studentSelect = document.getElementById('student-select'); // Obsolete
        // const supervisorSelect = document.getElementById('supervisor-select'); // Obsolete

        if (loggedInUser) {
            adminName.textContent = loggedInUser.username;
            loadAllData();
        }

        function loadAllData() {
            loadPendingUsers();
            loadProjectApplications();
            loadCompletedProjectsReview();
            loadSupervisorAssignments(); // Add this call
            loadUsers();
            // loadInternships(); // Obsolete
            // populateSelects(); // Obsolete
            loadProjects();
        }

        function loadPendingUsers() {
            const pendingUsersContainer = document.getElementById('pending-users-container');
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const pendingStudents = users.filter(u => u.userType === 'student' && u.status === 'pending');

            if (pendingStudents.length === 0) {
                pendingUsersContainer.innerHTML = '<div class="alert alert-secondary">No pending registrations.</div>';
                return;
            }

            pendingUsersContainer.innerHTML = '<table class="table table-striped table-hover"><thead><tr><th>Username</th><th>Full Name</th><th>University</th><th>CV</th><th class="text-end">Action</th></tr></thead><tbody>' +
                pendingStudents.map(user => `
                    <tr>
                        <td>${user.username}<br><small>${user.major}</small></td>
                        <td>${user.fullName}</td>
                        <td>${user.university}</td>
                        <td>${user.cv}</td>
                        <td class="text-end">
                            <button class="btn btn-success btn-sm approve-user" data-username="${user.username}">Approve</button>
                            <button class="btn btn-danger btn-sm reject-user" data-username="${user.username}">Reject</button>
                        </td>
                    </tr>
                `).join('') + '</tbody></table>';

            document.querySelectorAll('.approve-user').forEach(button => {
                button.addEventListener('click', (e) => {
                    approveUser(e.target.dataset.username);
                });
            });
            document.querySelectorAll('.reject-user').forEach(button => {
                button.addEventListener('click', (e) => {
                    if (confirm('Are you sure you want to reject this registration?')) {
                        rejectUser(e.target.dataset.username);
                    }
                });
            });
        }

        function approveUser(username) {
            let users = JSON.parse(localStorage.getItem('users')) || [];
            const userIndex = users.findIndex(u => u.username === username);
            if (userIndex > -1) {
                users[userIndex].status = 'approved';
                localStorage.setItem('users', JSON.stringify(users));
                showNotification('User approved successfully.');
                loadAllData();
            }
        }

        function rejectUser(username) {
            let users = JSON.parse(localStorage.getItem('users')) || [];
            users = users.filter(u => u.username !== username);
            localStorage.setItem('users', JSON.stringify(users));
            showNotification('User rejected and removed.');
            loadAllData();
        }

        function loadProjectApplications() {
            const applicationsContainer = document.getElementById('project-applications-container');
            const projects = JSON.parse(localStorage.getItem('projects')) || [];
            const pendingProjects = projects.filter(p => p.status === 'pending_approval');

            if (pendingProjects.length === 0) {
                applicationsContainer.innerHTML = '<div class="alert alert-secondary">No pending project applications.</div>';
                return;
            }

            applicationsContainer.innerHTML = '<table class="table table-striped table-hover"><thead><tr><th>Project Title</th><th>Student</th><th class="text-end">Action</th></tr></thead><tbody>' +
                pendingProjects.map(project => `
                    <tr>
                        <td>${project.title}</td>
                        <td>${project.pendingStudent}</td>
                        <td class="text-end">
                            <button class="btn btn-success btn-sm approve-project" data-id="${project.id}">Approve</button>
                            <button class="btn btn-danger btn-sm reject-project" data-id="${project.id}">Reject</button>
                        </td>
                    </tr>
                `).join('') + '</tbody></table>';

            document.querySelectorAll('.approve-project').forEach(button => {
                button.addEventListener('click', (e) => handleProjectApproval(e.target.dataset.id));
            });
            document.querySelectorAll('.reject-project').forEach(button => {
                button.addEventListener('click', (e) => handleProjectRejection(e.target.dataset.id));
            });
        }

        function handleProjectApproval(projectId) {
            let projects = JSON.parse(localStorage.getItem('projects')) || [];
            let users = JSON.parse(localStorage.getItem('users')) || [];
            const projectIndex = projects.findIndex(p => p.id == projectId);

            if (projectIndex > -1) {
                const studentUsername = projects[projectIndex].pendingStudent;
                const student = users.find(u => u.username === studentUsername);

                if (!student || !student.supervisor) {
                    showNotification('Error: Student does not have an assigned supervisor.', 'error');
                    return;
                }

                projects[projectIndex].status = 'in_progress';
                projects[projectIndex].assignedTo = studentUsername;
                projects[projectIndex].supervisor = student.supervisor; // Use pre-assigned supervisor
                delete projects[projectIndex].pendingStudent;
                localStorage.setItem('projects', JSON.stringify(projects));
                showNotification('Project approved successfully.');
                loadAllData();
            }
        }

        function handleProjectRejection(projectId) {
            let projects = JSON.parse(localStorage.getItem('projects')) || [];
            const projectIndex = projects.findIndex(p => p.id == projectId);
            if (projectIndex > -1) {
                projects[projectIndex].status = 'available';
                delete projects[projectIndex].pendingStudent;
                localStorage.setItem('projects', JSON.stringify(projects));
                showNotification('Project application rejected.');
                loadAllData();
            }
        }

        function loadCompletedProjectsReview() {
            const container = document.getElementById('completed-projects-container');
            const projects = JSON.parse(localStorage.getItem('projects')) || [];
            const completedProjects = projects.filter(p => p.status === 'pending_completion_approval');

            if (completedProjects.length === 0) {
                container.innerHTML = '<div class="alert alert-secondary">No projects awaiting final completion approval.</div>';
                return;
            }

            container.innerHTML = '<table class="table table-striped table-hover"><thead><tr><th>Project Title</th><th>Student</th><th>Supervisor</th><th class="text-end">Action</th></tr></thead><tbody>' +
                completedProjects.map(project => `
                    <tr>
                        <td>${project.title}</td>
                        <td>${project.assignedTo}</td>
                        <td>${project.supervisor}</td>
                        <td class="text-end">
                            <button class="btn btn-success btn-sm confirm-completion" data-id="${project.id}">Confirm Completion</button>
                        </td>
                    </tr>
                `).join('') + '</tbody></table>';

            document.querySelectorAll('.confirm-completion').forEach(button => {
                button.addEventListener('click', (e) => handleFinalCompletion(e.target.dataset.id));
            });
        }

        function handleFinalCompletion(projectId) {
            let projects = JSON.parse(localStorage.getItem('projects')) || [];
            const projectIndex = projects.findIndex(p => p.id == projectId);
            if (projectIndex > -1) {
                projects[projectIndex].status = 'completed';
                localStorage.setItem('projects', JSON.stringify(projects));
                showNotification('Project completion confirmed!');
                loadAllData();
            }
        }

        function loadSupervisorAssignments() {
            const container = document.getElementById('assign-supervisor-container');
            const users = JSON.parse(localStorage.getItem('users')) || [];

            const unassignedStudents = users.filter(u => u.userType === 'student' && u.status === 'approved' && !u.supervisor);
            const supervisors = users.filter(u => u.userType === 'supervisor');

            if (unassignedStudents.length === 0) {
                container.innerHTML = '<div class="alert alert-secondary">No students are awaiting a supervisor assignment.</div>';
                return;
            }

            const supervisorOptions = supervisors.map(s => `<option value="${s.username}">${s.username}</option>`).join('');

            container.innerHTML = '<table class="table table-striped table-hover"><thead><tr><th>Student</th><th>Full Name</th><th>University</th><th>Assign Supervisor</th><th class="text-end">Action</th></tr></thead><tbody>' +
                unassignedStudents.map(student => `
                    <tr>
                        <td>${student.username}</td>
                        <td>${student.fullName}</td>
                        <td>${student.university}</td>
                        <td>
                            <select class="form-select form-select-sm" id="assign-supervisor-for-${student.username}">
                                <option value="">Select...</option>
                                ${supervisorOptions}
                            </select>
                        </td>
                        <td class="text-end">
                            <button class="btn btn-primary btn-sm assign-supervisor" data-username="${student.username}">Assign</button>
                        </td>
                    </tr>
                `).join('') + '</tbody></table>';

            document.querySelectorAll('.assign-supervisor').forEach(button => {
                button.addEventListener('click', (e) => {
                    const studentUsername = e.target.dataset.username;
                    const supervisorSelect = document.getElementById(`assign-supervisor-for-${studentUsername}`);
                    if (supervisorSelect.value) {
                        handleAssignSupervisor(studentUsername, supervisorSelect.value);
                    } else {
                        showNotification('Please select a supervisor.', 'error');
                    }
                });
            });
        }

        function handleAssignSupervisor(studentUsername, supervisorUsername) {
            let users = JSON.parse(localStorage.getItem('users')) || [];
            const userIndex = users.findIndex(u => u.username === studentUsername);
            if (userIndex > -1) {
                users[userIndex].supervisor = supervisorUsername;
                localStorage.setItem('users', JSON.stringify(users));
                showNotification('Supervisor assigned successfully.');
                loadAllData();
            }
        }

        function loadUsers() {
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const approvedUsers = users.filter(u => u.userType !== 'admin' && u.status !== 'pending');
            if (approvedUsers.length === 0) {
                usersContainer.innerHTML = '<div class="alert alert-info">No approved students or supervisors found.</div>';
                return;
            }
            usersContainer.innerHTML = '<table class="table table-striped table-hover"><thead><tr><th>Username</th><th>Type</th><th class="text-end">Action</th></tr></thead><tbody>' +
                approvedUsers.map(user => `
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

            users.push({ username, password, userType, status: 'approved' }); // Admins create approved users
            localStorage.setItem('users', JSON.stringify(users));
            showNotification('User added successfully!');
            addUserForm.reset();
            loadAllData();
        });

        function deleteUser(username) {
            let users = JSON.parse(localStorage.getItem('users')) || [];
            users = users.filter(u => u.username !== username);
            localStorage.setItem('users', JSON.stringify(users));
            // Also delete any project applications from this user
            let projects = JSON.parse(localStorage.getItem('projects')) || [];
            const projectIndex = projects.findIndex(p => p.pendingStudent === username || p.assignedTo === username);
            if (projectIndex > -1) {
                // Handle project cleanup if user is deleted
                projects[projectIndex].status = 'available';
                delete projects[projectIndex].pendingStudent;
                delete projects[projectIndex].assignedTo;
                delete projects[projectIndex].supervisor;
                projects[projectIndex].progress = 0;
                localStorage.setItem('projects', JSON.stringify(projects));
            }
            showNotification('User deleted successfully.');
            loadAllData();
        }

        // Project CRUD Functions
        const addProjectForm = document.getElementById('add-project-form');

        function loadProjects() {
            const projectsContainer = document.getElementById('projects-container');
            const projects = JSON.parse(localStorage.getItem('projects')) || [];

            if (projects.length === 0) {
                projectsContainer.innerHTML = '<div class="alert alert-secondary">No projects created yet.</div>';
                return;
            }

            projectsContainer.innerHTML = '<table class="table table-striped table-hover"><thead><tr><th>Title</th><th>Status</th><th>Assigned To</th><th>Progress</th><th class="text-end">Action</th></tr></thead><tbody>' +
                projects.map(project => `
                    <tr>
                        <td>${project.title}</td>
                        <td><span class="badge bg-info">${project.status.replace('_', ' ')}</span></td>
                        <td>${project.assignedTo || 'N/A'}</td>
                        <td>
                            <div class="progress" style="height: 20px;">
                                <div class="progress-bar" style="width: ${project.progress}%;">${project.progress}%</div>
                            </div>
                        </td>
                        <td class="text-end">
                            <button class="btn btn-danger btn-sm delete-project" data-id="${project.id}">Delete</button>
                        </td>
                    </tr>
                `).join('') + '</tbody></table>';

            document.querySelectorAll('.delete-project').forEach(button => {
                button.addEventListener('click', (e) => {
                    if (confirm('Are you sure you want to delete this project?')) {
                        deleteProject(e.target.dataset.id);
                    }
                });
            });
        }

        addProjectForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('project-title').value;
            const description = document.getElementById('project-description').value;
            let projects = JSON.parse(localStorage.getItem('projects')) || [];

            const newProject = {
                id: Date.now(),
                title,
                description,
                status: 'available',
                assignedTo: null,
                supervisor: null,
                progress: 0
            };

            projects.push(newProject);
            localStorage.setItem('projects', JSON.stringify(projects));
            showNotification('Project added successfully!');
            addProjectForm.reset();
            loadProjects();
        });

        function deleteProject(projectId) {
            let projects = JSON.parse(localStorage.getItem('projects')) || [];
            projects = projects.filter(p => p.id != projectId);
            localStorage.setItem('projects', JSON.stringify(projects));
            showNotification('Project deleted successfully.');
            loadProjects();
        }
    }
});
