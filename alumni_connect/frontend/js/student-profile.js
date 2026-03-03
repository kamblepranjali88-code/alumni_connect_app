// Student Profile - Load and Edit Profile

document.addEventListener('DOMContentLoaded', async function() {
    console.log('✅ Profile page loaded');
    
    // Get user_id from session storage
    const userId = sessionStorage.getItem('userId');
    console.log('📌 User ID from session:', userId);
    
    if(!userId) {
        alert('Please login first');
        window.location.href = 'login.html';
        return;
    }
    
    // Load profile data
    await loadStudentProfile(userId);
    
    // Toggle edit mode
    document.getElementById('editProfileBtn').addEventListener('click', function() {
        document.getElementById('profileView').style.display = 'none';
        document.getElementById('profileEdit').style.display = 'block';
    });
    
    // Cancel edit
    document.getElementById('cancelEditBtn').addEventListener('click', function() {
        document.getElementById('profileView').style.display = 'block';
        document.getElementById('profileEdit').style.display = 'none';
    });
    
    // Handle form submission
    document.getElementById('profileForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await updateStudentProfile(userId);
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        sessionStorage.clear();
        window.location.href = 'login.html';
    });
});

// Function to load student profile
async function loadStudentProfile(userId) {
    try {
        const response = await fetch(`http://localhost:5000/api/auth/student/profile/${userId}`);
        
        if(response.ok) {
            const student = await response.json();
            console.log('✅ Student data:', student);
            
            // Update all fields in VIEW mode
            updateViewMode(student);
            
            // Populate EDIT mode fields
            populateEditMode(student);
            
        } else if(response.status === 404) {
            console.log('❌ Student profile not found');
            document.querySelectorAll('.value, h2, .goals-text').forEach(el => {
                if(el.id !== 'statRequests' && el.id !== 'statMentors' && 
                   el.id !== 'statEvents' && el.id !== 'statPosts') {
                    el.textContent = 'Not available';
                }
            });
        } else {
            console.error('Failed to fetch profile');
        }
    } catch(error) {
        console.error('Error loading profile:', error);
    }
}

// Update VIEW mode
function updateViewMode(student) {
    // Format year
    const yearText = student.year ? `${student.year}${getYearSuffix(student.year)} Year` : '-';
    
    // Hero section
    document.getElementById('displayFullName').textContent = student.full_name || 'Student';
    document.getElementById('displayRollNumber').textContent = student.roll_number || '-';
    document.getElementById('displayBranch').textContent = student.branch || '-';
    document.getElementById('displayYear').textContent = yearText;
    
    // Avatar
    if(student.full_name) {
        const nameForAvatar = encodeURIComponent(student.full_name);
        document.getElementById('avatarImg').src = `https://ui-avatars.com/api/?name=${nameForAvatar}&size=150&background=2563eb&color=fff`;
    }
    
    // Basic info section
    document.getElementById('displayFullName2').textContent = student.full_name || '-';
    document.getElementById('displayEmail').textContent = student.email || '-';
    document.getElementById('displayBranch2').textContent = student.branch || '-';
    document.getElementById('displayYear2').textContent = yearText;
    
    // Interests/Skills
    const interestsContainer = document.getElementById('displayInterests');
    if(student.interests && student.interests.length > 0) {
        interestsContainer.innerHTML = student.interests.map(interest => 
            `<span class="tag">${interest}</span>`
        ).join('');
    } else {
        interestsContainer.innerHTML = '<span class="tag">No skills added</span>';
    }
    
    // Goals (you'll need to add this column to your database)
    if(document.getElementById('displayGoals')) {
        document.getElementById('displayGoals').textContent = student.goals || 'No goals added yet.';
    }
    
    // Social links (you'll need to add these columns to your database)
    const linkedinLink = document.getElementById('linkedinLink');
    const githubLink = document.getElementById('githubLink');
    const linkedinText = document.getElementById('linkedinText');
    const githubText = document.getElementById('githubText');
    
    if(student.linkedin) {
        linkedinLink.href = student.linkedin;
        linkedinText.textContent = student.linkedin.replace('https://', '');
    } else {
        linkedinText.textContent = 'Not added';
        linkedinLink.href = '#';
    }
    
    if(student.github) {
        githubLink.href = student.github;
        githubText.textContent = student.github.replace('https://', '');
    } else {
        githubText.textContent = 'Not added';
        githubLink.href = '#';
    }
}

// Populate EDIT mode
function populateEditMode(student) {
    document.getElementById('editFullName').value = student.full_name || '';
    document.getElementById('editRollNumber').value = student.roll_number || '';
    document.getElementById('editEmail').value = student.email || '';
    document.getElementById('editBranch').value = student.branch || 'Information Technology';
    document.getElementById('editYear').value = student.year || '2';
    
    // Interests
    if(student.interests && student.interests.length > 0) {
        document.getElementById('editInterests').value = student.interests.join(', ');
    } else {
        document.getElementById('editInterests').value = '';
    }
    
    // Goals (if column exists)
    if(document.getElementById('editGoals')) {
        document.getElementById('editGoals').value = student.goals || '';
    }
    
    // Social links (if columns exist)
    if(document.getElementById('editLinkedin')) {
        document.getElementById('editLinkedin').value = student.linkedin || '';
    }
    if(document.getElementById('editGithub')) {
        document.getElementById('editGithub').value = student.github || '';
    }
}

// Helper function for year suffix
function getYearSuffix(year) {
    if(year == 1) return 'st';
    if(year == 2) return 'nd';
    if(year == 3) return 'rd';
    return 'th';
}

// Function to update profile (you'll implement this)
// Function to update profile
async function updateStudentProfile(userId) {
    try {
        // Get form data
        const updatedData = {
            full_name: document.getElementById('editFullName').value,
            email: document.getElementById('editEmail').value,
            branch: document.getElementById('editBranch').value,
            year: parseInt(document.getElementById('editYear').value),
            interests: document.getElementById('editInterests').value.split(',').map(i => i.trim()).filter(i => i)
        };

        // Add optional fields if they exist
        if (document.getElementById('editGoals')) {
            updatedData.goals = document.getElementById('editGoals').value;
        }
        if (document.getElementById('editLinkedin')) {
            updatedData.linkedin = document.getElementById('editLinkedin').value;
        }
        if (document.getElementById('editGithub')) {
            updatedData.github = document.getElementById('editGithub').value;
        }

        console.log('📤 Sending update request:', updatedData);

        // Show saving state
        const saveBtn = document.querySelector('.save-btn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveBtn.disabled = true;

        // Send update to backend
        const response = await fetch(`http://localhost:5000/api/auth/student/profile/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData)
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ Update successful:', result);
            alert('Profile updated successfully!');
            
            // Switch back to view mode
            document.getElementById('profileView').style.display = 'block';
            document.getElementById('profileEdit').style.display = 'none';
            
            // Reload profile to show updated data
            await loadStudentProfile(userId);
        } else {
            console.error('❌ Update failed:', result);
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('❌ Error updating profile:', error);
        alert('Network error. Please try again.');
    } finally {
        // Reset button
        const saveBtn = document.querySelector('.save-btn');
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
        saveBtn.disabled = false;
    }
}