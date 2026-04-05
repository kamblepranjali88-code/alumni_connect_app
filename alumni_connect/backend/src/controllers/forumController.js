const { supabase } = require('../config/supabase');

// Helper: Get user name and type from user_id
const getUserInfo = async (userId) => {
    // ✅ FIX: Removed parseInt() — user_id is a UUID (string), parseInt returns NaN on UUIDs
    const { data: student } = await supabase
        .from('students')
        .select('student_id, full_name')
        .eq('user_id', userId)   // ← was parseInt(userId)
        .single();

    if (student) {
        return { id: student.student_id, name: student.full_name, type: 'student' };
    }

    const { data: alumni } = await supabase
        .from('alumni')
        .select('alumni_id, full_name')
        .eq('user_id', userId)   // ← was parseInt(userId)
        .single();

    if (alumni) {
        return { id: alumni.alumni_id, name: alumni.full_name, type: 'alumni' };
    }

    return null;
};

// GET /api/forum/posts - Get all posts (newest first)
const getAllPosts = async (req, res) => {
    try {
        const { data: posts, error } = await supabase
            .from('forum_posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Get comment count for each post
        for (let post of posts) {
            const { count } = await supabase
                .from('forum_comments')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', post.id);

            post.comment_count = count || 0;
        }

        res.json({ success: true, posts: posts || [] });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/forum/posts/:postId - Get single post with comments
const getPostById = async (req, res) => {
    try {
        const { postId } = req.params;

        const { data: post, error: postError } = await supabase
            .from('forum_posts')
            .select('*')
            .eq('id', postId)
            .single();

        if (postError || !post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const { data: comments } = await supabase
            .from('forum_comments')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        res.json({ success: true, post, comments: comments || [] });
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/forum/posts - Create new post
const createPost = async (req, res) => {
    try {
        const { user_id, title, content } = req.body;

        if (!user_id || !title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }

        const userInfo = await getUserInfo(user_id);
        if (!userInfo) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { data: post, error } = await supabase
            .from('forum_posts')
            .insert([{
                title,
                content,
                author_id:   userInfo.id,
                author_type: userInfo.type,
                author_name: userInfo.name
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, message: 'Post created successfully', post });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/forum/comments - Add comment to post
const addComment = async (req, res) => {
    try {
        const { post_id, user_id, content } = req.body;

        if (!post_id || !user_id || !content) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const userInfo = await getUserInfo(user_id);
        if (!userInfo) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { data: post, error: postError } = await supabase
            .from('forum_posts')
            .select('id')
            .eq('id', post_id)
            .single();

        if (postError || !post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const { data: comment, error } = await supabase
            .from('forum_comments')
            .insert([{
                post_id,
                content,
                author_id:   userInfo.id,
                author_type: userInfo.type,
                author_name: userInfo.name
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, message: 'Comment added', comment });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/forum/posts/:postId - Delete a post (only author)
const deletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({ message: 'User ID required' });
        }

        const userInfo = await getUserInfo(user_id);
        if (!userInfo) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { data: post, error: postError } = await supabase
            .from('forum_posts')
            .select('*')
            .eq('id', postId)
            .single();

        if (postError || !post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // ✅ FIX: Cast both sides to string for safe comparison (avoids int vs string mismatch)
        if (post.author_id.toString() !== userInfo.id.toString() || post.author_type !== userInfo.type) {
            return res.status(403).json({ message: 'You can only delete your own posts' });
        }

        const { error: deleteError } = await supabase
            .from('forum_posts')
            .delete()
            .eq('id', postId);

        if (deleteError) throw deleteError;

        res.json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/forum/comments/:commentId - Delete a comment (only author)
const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({ message: 'User ID required' });
        }

        const userInfo = await getUserInfo(user_id);
        if (!userInfo) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { data: comment, error: commentError } = await supabase
            .from('forum_comments')
            .select('*')
            .eq('id', commentId)
            .single();

        if (commentError || !comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // ✅ FIX: Cast both sides to string for safe comparison
        if (comment.author_id.toString() !== userInfo.id.toString() || comment.author_type !== userInfo.type) {
            return res.status(403).json({ message: 'You can only delete your own comments' });
        }

        const { error: deleteError } = await supabase
            .from('forum_comments')
            .delete()
            .eq('id', commentId);

        if (deleteError) throw deleteError;

        res.json({ success: true, message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getAllPosts,
    getPostById,
    createPost,
    addComment,
    deletePost,
    deleteComment
};