document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
});

async function loadPosts() {
    const container = document.getElementById('postsContainer');

    try {
        const response = await fetch('http://localhost:5000/api/forum/posts');
        const data = await response.json();

        if (!data.success || !data.posts || data.posts.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-comments"></i><p>No posts yet. Be the first to start a discussion!</p></div>';
            return;
        }

        const userType  = sessionStorage.getItem('userType');
        const studentId = sessionStorage.getItem('student_id');
        const alumniId  = sessionStorage.getItem('alumni_id');

        container.innerHTML = data.posts.map(post => {
            const date          = new Date(post.created_at);
            const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            // ✅ Compare author_id (string) against student_id / alumni_id (string from sessionStorage)
            let isAuthor = false;
            if (userType === 'student') {
                isAuthor = studentId != null && post.author_id.toString() === studentId;
            } else if (userType === 'alumni') {
                isAuthor = alumniId != null && post.author_id.toString() === alumniId;
            }

            return `
                <div class="post-card ${isAuthor ? 'my-post' : ''}" data-post-id="${post.id}">
                    <div class="post-header">
                        <h3 class="post-title">
                            ${escapeHtml(post.title)}
                            ${isAuthor ? '<span class="my-post-badge">Your Post</span>' : ''}
                        </h3>
                        ${isAuthor ? `<button class="delete-post-btn" data-id="${post.id}"><i class="fas fa-trash"></i> Delete</button>` : ''}
                    </div>
                    <p class="post-content">${escapeHtml(post.content.substring(0, 150))}${post.content.length > 150 ? '...' : ''}</p>
                    <div class="post-meta">
                        <span>
                            <i class="fas fa-user"></i> ${escapeHtml(post.author_name)}
                            <span class="author-badge ${post.author_type === 'student' ? 'badge-student' : 'badge-alumni'}">
                                ${post.author_type === 'student' ? 'Student' : 'Alumni'}
                            </span>
                        </span>
                        <span><i class="fas fa-calendar-alt"></i> ${formattedDate} at ${formattedTime}</span>
                        <span><i class="fas fa-comment"></i> ${post.comment_count || 0} comments</span>
                    </div>
                </div>
            `;
        }).join('');

        // Attach delete button listeners
        document.querySelectorAll('.delete-post-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                deletePost(btn.dataset.id);
            });
        });

        // Attach card click listeners
        document.querySelectorAll('.post-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-post-btn')) {
                    viewPost(card.dataset.postId);
                }
            });
        });

    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Failed to load posts. Refresh the page.</p></div>';
    }
}

function viewPost(postId) {
    window.location.href = `forum-post-details.html?id=${postId}`;
}

async function deletePost(postId) {
    if (!confirm('Delete this post? All comments will be deleted.')) return;

    const userId = sessionStorage.getItem('userId');
    if (!userId) return alert('Please login');

    try {
        const response = await fetch(`http://localhost:5000/api/forum/posts/${postId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            // ✅ FIX: Send userId as plain string — backend getUserInfo expects UUID string, not a number
            body: JSON.stringify({ user_id: userId })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Post deleted!');
            loadPosts();
        } else {
            alert(data.message || 'Failed to delete');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Something went wrong');
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}