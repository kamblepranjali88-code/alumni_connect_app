let postId = null;

document.addEventListener('DOMContentLoaded', () => {

const backLink = document.getElementById('backLink');
const userType = sessionStorage.getItem('userType');

if(backLink){

backLink.href =
userType === 'alumni'
? 'alumni-forum.html'
: 'forum.html';

}

});

document.addEventListener('DOMContentLoaded', () => {
    setDynamicNavbar();
    
    const urlParams = new URLSearchParams(window.location.search);
    postId = urlParams.get('id');
    
    if (!postId) {
        const userType = sessionStorage.getItem('userType');
        window.location.href = userType === 'alumni' ? 'alumni-forum.html' : 'forum.html';
        return;
    }
    
    loadPostDetails();
});

function setDynamicNavbar() {
    const userType = sessionStorage.getItem('userType');
    const navbar = document.getElementById('dynamicNavbar');
    const backLink = document.getElementById('backLink');
    
    if (!navbar) return;
    
    if (userType === 'alumni') {
        navbar.innerHTML = `
            <a href="alumni-dashboard.html">Dashboard</a>
            <a href="alumni-profile.html">My Profile</a>
            <a href="mentorship-requests.html">Requests</a>
            <a href="my-connections-alumni.html">My Connections</a>
            <a href="alumni-post-job.html">Post Job</a>
            <a href="events.html">Events</a>
            <a href="alumni-forum.html">Forum</a>
            <a href="login.html" class="logout">Logout</a>
        `;
        if (backLink) backLink.href = 'alumni-forum.html';
    } else {
        navbar.innerHTML = `
            <a href="student-dashboard.html">Dashboard</a>
            <a href="student-profile.html">My Profile</a>
            <a href="search-alumni.html">Search Alumni</a>
            <a href="my-connections-student.html">My Connections</a>
            <a href="job-opportunities.html">Jobs</a>
            <a href="events.html">Events</a>
            <a href="forum.html">Forum</a>
            <a href="login.html" class="logout">Logout</a>
        `;
        if (backLink) backLink.href = 'forum.html';
    }
}

async function loadPostDetails() {
    try {
        const response = await fetch(`https://alumni-connect-backend-yy97.onrender.com/api/forum/posts/${postId}`);
        const data = await response.json();
        
        if (!data.success) {
            const userType = sessionStorage.getItem('userType');
            window.location.href = userType === 'alumni' ? 'alumni-forum.html' : 'forum.html';
            return;
        }
        
        displayPost(data.post);
        displayComments(data.comments);
        displayCommentForm();
        
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('postContainer').innerHTML = '<p>Failed to load post</p>';
    }
}

function displayPost(post) {
    const date = new Date(post.created_at);
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit'
    });
    
  const userType = sessionStorage.getItem('userType');
const studentId = sessionStorage.getItem('student_id');
const alumniId = sessionStorage.getItem('alumni_id');

let isAuthor = false;
if (userType === 'student') {
    isAuthor = studentId && post.author_id.toString() === studentId;
} else if (userType === 'alumni') {
    isAuthor = alumniId && post.author_id.toString() === alumniId;
}
    
    document.getElementById('postContainer').innerHTML = `
        <div class="post-detail-card ${isAuthor ? 'my-post' : ''}">
            <div class="post-detail-header">
                <h1 class="post-detail-title">${escapeHtml(post.title)}</h1>
                ${isAuthor ? '<span class="my-post-badge">📌 Your Post</span>' : ''}
            </div>
            <div class="post-meta">
                <span class="post-author">
                    <i class="fas fa-user"></i>
                    ${escapeHtml(post.author_name)}
                    <span class="author-badge ${post.author_type === 'student' ? 'badge-student' : 'badge-alumni'}">
                        ${post.author_type === 'student' ? 'Student' : 'Alumni'}
                    </span>
                </span>
                <span class="post-date">
                    <i class="fas fa-calendar-alt"></i>
                    ${formattedDate} at ${formattedTime}
                </span>
            </div>
            <div class="post-detail-content">${escapeHtml(post.content)}</div>
        </div>
    `;
}

function displayComments(comments) {
    const container = document.getElementById('commentsContainer');
    const userType = sessionStorage.getItem('userType');
    const studentId = sessionStorage.getItem('student_id');
    const alumniId = sessionStorage.getItem('alumni_id');
    
    if (!comments || comments.length === 0) {
        container.innerHTML = `
            <div class="comments-section">
                <h3><i class="fas fa-comments"></i> Comments (0)</h3>
                <p style="color: #64748b; text-align: center;">No comments yet. Be the first to reply!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="comments-section">
            <h3><i class="fas fa-comments"></i> Comments (${comments.length})</h3>
            ${comments.map(comment => {
                const date = new Date(comment.created_at);
                const formattedDate = date.toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric'
                });
                const formattedTime = date.toLocaleTimeString('en-US', {
                    hour: '2-digit', minute: '2-digit'
                });
                
                let isAuthor = false;
                if (userType === 'student') {
                    isAuthor = studentId && comment.author_id.toString() === studentId;
                } else if (userType === 'alumni') {
                    isAuthor = alumniId && comment.author_id.toString() === alumniId;
                }
                
                return `
                    <div class="comment-card ${isAuthor ? 'my-comment' : ''}" id="comment-${comment.id}">
                        <div class="comment-content">${escapeHtml(comment.content)}</div>
                        <div class="comment-meta">
                            <span>
                                <i class="fas fa-user"></i> ${escapeHtml(comment.author_name)}
                                <span class="author-badge ${comment.author_type === 'student' ? 'badge-student' : 'badge-alumni'}">
                                    ${comment.author_type === 'student' ? 'Student' : 'Alumni'}
                                </span>
                                ${isAuthor ? '<span class="your-comment-badge">(You)</span>' : ''}
                            </span>
                            <span><i class="fas fa-calendar-alt"></i> ${formattedDate} at ${formattedTime}</span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function displayCommentForm() {
    document.getElementById('commentFormContainer').innerHTML = `
        <div class="comment-form">
            <h3><i class="fas fa-reply"></i> Add a Reply</h3>
            <textarea id="commentContent" rows="4" placeholder="Write your response..."></textarea>
            <button class="btn-submit" onclick="submitComment()">
                <i class="fas fa-paper-plane"></i> Post Reply
            </button>
        </div>
    `;
}

async function submitComment() {
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
        alert('Please login first');
        window.location.href = 'login.html';
        return;
    }
    
    const content = document.getElementById('commentContent').value.trim();
    if (!content) {
        alert('Please write a reply');
        return;
    }
    
    const submitBtn = document.querySelector('.comment-form .btn-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
    
    try {
        const response = await fetch('https://alumni-connect-backend-yy97.onrender.com/api/forum/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                post_id: parseInt(postId),
                user_id: parseInt(userId),
                content: content
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Reply posted!', 'success');
            document.getElementById('commentContent').value = '';
            loadPostDetails();
        } else {
            showToast(data.message || 'Failed to post reply', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Something went wrong', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Post Reply';
    }
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
