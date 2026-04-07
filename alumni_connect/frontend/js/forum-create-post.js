document.getElementById('createPostForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userId = sessionStorage.getItem('userId');
    const userType = sessionStorage.getItem('userType');
    
    if (!userId) {
        alert('Please login first');
        window.location.href = 'login.html';
        return;
    }
    
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    
    if (!title || !content) {
        alert('Please fill in all fields');
        return;
    }
    
    const submitBtn = document.querySelector('.btn-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
    
    try {
        const response = await fetch('http://localhost:5000/api/forum/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: parseInt(userId),
                title: title,
                content: content
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Post created successfully!', 'success');
            
            // ✅ CORRECT REDIRECT
            if (userType === 'alumni') {
                setTimeout(() => {
                    window.location.href = 'alumni-forum.html';
                }, 1000);
            } else {
                setTimeout(() => {
                    window.location.href = 'forum.html';
                }, 1000);
            }
        } else {
            showToast(data.message || 'Failed to create post', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Post';
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Something went wrong', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Post';
    }
});

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}