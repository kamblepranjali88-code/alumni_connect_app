// ===== LIVE PREVIEW =====
const titleInput = document.getElementById('title');
const companyInput = document.getElementById('company');
const previewTitle = document.getElementById('previewTitle');
const previewCompany = document.getElementById('previewCompany');

titleInput.addEventListener('input', function() {
    previewTitle.textContent = this.value || 'Software Engineer';
});

companyInput.addEventListener('input', function() {
    previewCompany.textContent = this.value || 'Google';
});

// ===== LOAD ALL POSTED JOBS FOR THIS ALUMNI =====
async function loadMyJobs() {
    const userId = sessionStorage.getItem('userId');
    
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }
    
    const container = document.getElementById('jobsHistoryContainer');
    
    try {
        const response = await fetch(`http://localhost:5000/api/jobs/my-jobs?user_id=${userId}`);
        const data = await response.json();
        
        // Update total count badge
        document.getElementById('totalJobsCount').textContent = data.total || 0;
        
        if (!data.jobs || data.jobs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-briefcase"></i>
                    <p>No jobs posted yet</p>
                    <small>Fill the form above to share your first opportunity!</small>
                </div>
            `;
            return;
        }
        
        // Display each job with formatted date and time
        container.innerHTML = data.jobs.map(job => {
            const postedDate = new Date(job.posted_date);
            const formattedDate = postedDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const formattedTime = postedDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            return `
                <div class="job-card" data-job-id="${job.id}">
                    <div class="job-info">
                        <div class="job-title">${escapeHtml(job.title)}</div>
                        <div class="job-company">
                            <i class="fas fa-building"></i>
                            <span>${escapeHtml(job.company)}</span>
                        </div>
                        <div class="job-meta">
                            <span class="job-date">
                                <i class="fas fa-calendar-alt"></i>
                                Posted: ${formattedDate} at ${formattedTime}
                            </span>
                            <span class="job-status ${job.status === 'active' ? 'status-active' : 'status-closed'}">
                                <i class="fas ${job.status === 'active' ? 'fa-check-circle' : 'fa-ban'}"></i>
                                ${job.status === 'active' ? 'Active' : 'Closed'}
                            </span>
                        </div>
                    </div>
                    <div class="job-actions">
                        <button class="btn-view-link" onclick="window.open('${job.application_link}', '_blank')">
                            <i class="fas fa-external-link-alt"></i> View
                        </button>
                        <button class="btn-copy-link" onclick="copyLink('${job.application_link}')">
                            <i class="fas fa-copy"></i> Copy Link
                        </button>
                        <button class="btn-delete-job" onclick="deleteJob(${job.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading jobs:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load your jobs</p>
                <small>Please refresh the page</small>
            </div>
        `;
    }
}

// ===== HELPER: Escape HTML to prevent XSS =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== COPY LINK TO CLIPBOARD =====
function copyLink(link) {
    navigator.clipboard.writeText(link).then(() => {
        showToast('Link copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy link', 'error');
    });
}

// ===== SHOW TOAST NOTIFICATION =====
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ===== DELETE JOB =====
async function deleteJob(jobId) {
    if (!confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) return;
    
    const userId = sessionStorage.getItem('userId');
    
    try {
        const response = await fetch(`http://localhost:5000/api/jobs/${jobId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: parseInt(userId) })
        });
        
        if (response.ok) {
            showToast('Job deleted successfully!', 'success');
            loadMyJobs(); // Reload the jobs list
        } else {
            const data = await response.json();
            showToast(data.message || 'Failed to delete job', 'error');
        }
    } catch (error) {
        console.error('Error deleting job:', error);
        showToast('Something went wrong', 'error');
    }
}

// ===== POST NEW JOB =====
document.getElementById('postJobForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
        alert('Please login first');
        window.location.href = 'login.html';
        return;
    }
    
    const jobData = {
        user_id: parseInt(userId),
        title: document.getElementById('title').value.trim(),
        company: document.getElementById('company').value.trim(),
        application_link: document.getElementById('applicationLink').value.trim()
    };
    
    // Validation
    if (!jobData.title) {
        showToast('Please enter job title', 'error');
        return;
    }
    if (!jobData.company) {
        showToast('Please enter company name', 'error');
        return;
    }
    if (!jobData.application_link) {
        showToast('Please enter application link', 'error');
        return;
    }
    
    // Validate URL format
    const urlPattern = /^(https?:\/\/)/i;
    if (!urlPattern.test(jobData.application_link)) {
        showToast('Please enter a valid URL starting with http:// or https://', 'error');
        return;
    }
    
    const submitBtn = document.querySelector('.btn-post');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Posting...</span>';
    
    try {
        const response = await fetch('http://localhost:5000/api/jobs/post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jobData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Show success modal
            document.getElementById('successModal').style.display = 'flex';
            
            // Reset form
            document.getElementById('postJobForm').reset();
            previewTitle.textContent = 'Software Engineer';
            previewCompany.textContent = 'Google';
            
            // Refresh the jobs list
            loadMyJobs();
            
        } else {
            showToast(data.message || 'Failed to post job', 'error');
        }
    } catch (error) {
        console.error('Error posting job:', error);
        showToast('Something went wrong. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i><span>Post Job</span>';
    }
});

// ===== MODAL FUNCTIONS =====
function resetForm() {
    document.getElementById('successModal').style.display = 'none';
    document.getElementById('postJobForm').reset();
    previewTitle.textContent = 'Software Engineer';
    previewCompany.textContent = 'Google';
}

function goToDashboard() {
    window.location.href = 'alumni-dashboard.html';
}

function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('successModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// ===== LOAD JOBS WHEN PAGE LOADS =====
document.addEventListener('DOMContentLoaded', () => {
    loadMyJobs();
});