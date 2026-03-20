const BASE_URL = 'http://localhost:5000/api/alumni';

const list               = document.getElementById('alumniList');
const searchInput        = document.getElementById('searchInput');
const filterBranch       = document.getElementById('filterBranch');
const filterYear         = document.getElementById('filterYear');
const filterAvailability = document.getElementById('filterAvailability');

// ===== FETCH ALUMNI FROM DB =====
async function fetchAlumni() {
    try {
        // Build query params from filters
        const params = new URLSearchParams();

        const search       = searchInput.value.trim();
        const branch       = filterBranch.value;
        const year         = filterYear.value;
        const availability = filterAvailability.value;

        if (search)       params.append('search', search);
        if (branch)       params.append('branch', branch);
        if (year)         params.append('graduation_year', year);
        if (availability) params.append('available_for_mentorship', availability);

        const url = `${BASE_URL}/search?${params.toString()}`;
        console.log('Fetching:', url);

        list.innerHTML = '<p class="loading-text">Loading alumni...</p>';

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch alumni');

        const alumniData = await response.json();
        renderAlumni(alumniData);

    } catch (error) {
        console.error('Error fetching alumni:', error);
        list.innerHTML = '<p class="error-text">❌ Error loading alumni. Please try again.</p>';
    }
}

// ===== RENDER ALUMNI CARDS =====
function renderAlumni(data) {
    list.innerHTML = '';

    if (data.length === 0) {
        list.innerHTML = '<p class="no-results">No alumni found matching your search.</p>';
        return;
    }

    data.forEach(alumni => {
        const avatarSrc = alumni.profile_photo ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(alumni.full_name || 'A')}&size=60&background=2563eb&color=fff`;

        const isAvailable = alumni.available_for_mentorship;

        list.innerHTML += `
            <div class="alumni-item">
                <div class="alumni-avatar">
                    <img src="${avatarSrc}" alt="${alumni.full_name}" 
                         onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(alumni.full_name || 'A')}&size=60&background=2563eb&color=fff'">
                </div>
                <div class="alumni-info">
                    <span class="alumni-name">${alumni.full_name || 'Unknown'}</span>
                    <span class="alumni-meta">
                        ${alumni.designation ? alumni.designation + ' at ' + (alumni.company || '') : (alumni.company || 'Not specified')}
                        <br>
                        ${alumni.branch || ''} • Passout ${alumni.graduation_year || ''}
                    </span>
                    <span class="badge ${isAvailable ? 'available' : 'unavailable'}">
                        ${isAvailable ? '✅ Available for Mentorship' : '❌ Not Available'}
                    </span>
                </div>
                <div class="actions">
                    <button class="view-btn" onclick="viewProfile(${alumni.user_id})">
                        View Profile
                    </button>
                    <button class="request-btn" 
                        ${isAvailable ? '' : 'disabled'}
                        onclick="sendRequest(${alumni.user_id}, '${alumni.full_name}')">
                        Request
                    </button>
                </div>
            </div>
        `;
    });
}

// ===== VIEW ALUMNI PROFILE =====
function viewProfile(alumniUserId) {
    window.location.href = `view-alumni-profile.html?id=${alumniUserId}`;
}

// ===== SEND MENTORSHIP REQUEST =====
function sendRequest(alumniUserId, alumniName) {
    const studentId = sessionStorage.getItem('userId');
    if (!studentId) {
        alert('Please login first');
        window.location.href = 'login.html';
        return;
    }
    // Will implement mentorship request later
    alert(`Mentorship request sent to ${alumniName}! 🎉`);
}

// ===== FILTER LISTENERS =====
let searchTimeout;
searchInput.addEventListener('input', () => {
    // Debounce search — wait 500ms after user stops typing
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(fetchAlumni, 500);
});

filterBranch.addEventListener('change', fetchAlumni);
filterYear.addEventListener('change', fetchAlumni);
filterAvailability.addEventListener('change', fetchAlumni);

// ===== CLEAR FILTERS =====
document.getElementById('clearFilters').addEventListener('click', () => {
    searchInput.value       = '';
    filterBranch.value      = '';
    filterYear.value        = '';
    filterAvailability.value = '';
    fetchAlumni();
});

// ===== LOGOUT =====
document.querySelector('.logout')?.addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.clear();
    window.location.href = 'login.html';
});

// ===== LOAD ON PAGE START =====
fetchAlumni();