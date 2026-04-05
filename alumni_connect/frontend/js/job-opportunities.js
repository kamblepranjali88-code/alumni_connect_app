let allJobs = [];

// Load jobs when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadJobs();
    setupEventListeners();
});

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterJobs);
    }
    
    const filterCompany = document.getElementById('filterCompany');
    if (filterCompany) {
        filterCompany.addEventListener('change', filterJobs);
    }
}

async function loadJobs() {
    const container = document.getElementById('jobsGrid');
    
    try {
        const response = await fetch('http://localhost:5000/api/jobs');
        const data = await response.json();
        
        if (data.success && data.jobs) {
            allJobs = data.jobs;
            updateStats(allJobs);
            populateCompanyFilter(allJobs);
            displayJobs(allJobs);
        } else {
            container.innerHTML = `
                <div class="loading-state">
                    <p>No jobs available at the moment.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading jobs:', error);
        container.innerHTML = `
            <div class="loading-state">
                <p>Failed to load jobs. Please refresh the page.</p>
            </div>
        `;
    }
}

function updateStats(jobs) {
    // Total jobs
    document.getElementById('totalJobs').textContent = jobs.length;
    
    // Unique companies
    const uniqueCompanies = [...new Set(jobs.map(job => job.company))];
    document.getElementById('totalCompanies').textContent = uniqueCompanies.length;
    
    // New this week (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newJobs = jobs.filter(job => {
        const postedDate = new Date(job.posted_date);
        return postedDate >= oneWeekAgo;
    });
    document.getElementById('newJobs').textContent = newJobs.length;
}

function populateCompanyFilter(jobs) {
    const companies = [...new Set(jobs.map(job => job.company))];
    const filterSelect = document.getElementById('filterCompany');
    
    filterSelect.innerHTML = '<option value="all">All Companies</option>';
    companies.sort().forEach(company => {
        filterSelect.innerHTML += `<option value="${company}">${company}</option>`;
    });
}

function filterJobs() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const selectedCompany = document.getElementById('filterCompany').value;
    
    let filtered = allJobs;
    
    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(job => 
            job.title.toLowerCase().includes(searchTerm) ||
            job.company.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filter by company
    if (selectedCompany !== 'all') {
        filtered = filtered.filter(job => job.company === selectedCompany);
    }
    
    displayJobs(filtered);
}

function displayJobs(jobs) {
    const container = document.getElementById('jobsGrid');
    const jobsCount = document.getElementById('jobsCount');
    const noResults = document.getElementById('noResults');
    
    jobsCount.textContent = `${jobs.length} job${jobs.length !== 1 ? 's' : ''} found`;
    
    if (jobs.length === 0) {
        container.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    
    container.innerHTML = jobs.map(job => {
        const postedDate = new Date(job.posted_date);
        const formattedDate = postedDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const isNew = (new Date() - new Date(job.posted_date)) < (7 * 24 * 60 * 60 * 1000);
        
        return `
            <div class="job-card">
                ${isNew ? '<span class="job-badge">New</span>' : ''}
                <h3 class="job-title">${escapeHtml(job.title)}</h3>
                <div class="job-company">
                    <i class="fas fa-building"></i>
                    <span>${escapeHtml(job.company)}</span>
                </div>
                <div class="job-posted-by">
                    <i class="fas fa-user-graduate"></i>
                    <span>Posted by: ${escapeHtml(job.posted_by_name || 'Alumni')}</span>
                </div>
                <div class="job-date">
                    <i class="fas fa-calendar-alt"></i>
                    <span>Posted on: ${formattedDate}</span>
                </div>
                <div class="job-divider"></div>
                <div class="job-footer">
                    <a href="${job.application_link}" target="_blank" class="btn-apply">
                        <i class="fas fa-external-link-alt"></i> Apply Now
                    </a>
                    <button class="btn-save" onclick="copyLink('${job.application_link}')">
                        <i class="fas fa-copy"></i> Copy Link
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function copyLink(link) {
    navigator.clipboard.writeText(link).then(() => {
        showToast('Link copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy link', 'error');
    });
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}