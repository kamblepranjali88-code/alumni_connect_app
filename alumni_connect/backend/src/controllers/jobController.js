const { supabase } = require('../config/supabase');
const { sendNewJobNotificationToAll } = require('../utils/emailService'); 


// Helper: Get alumni_id and full_name from user_id
const getAlumniData = async (userId) => {
    const { data, error } = await supabase
        .from('alumni')
        .select('alumni_id, full_name')
        .eq('user_id', parseInt(userId))
        .single();
    
    if (error) {
        console.error('getAlumniData error:', error);
        return null;
    }
    return data;
};

// Helper: Get only alumni_id
const getAlumniId = async (userId) => {
    const data = await getAlumniData(userId);
    return data?.alumni_id || null;
};

// POST /api/jobs/post - Alumni post a job
const postJob = async (req, res) => {
    try {
        const { user_id, title, company, application_link } = req.body;

        console.log('📝 Posting job for user_id:', user_id);

        if (!user_id || !title || !company || !application_link) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Get alumni data
        const { data: alumni, error: alumniError } = await supabase
            .from('alumni')
            .select('alumni_id, full_name')
            .eq('user_id', parseInt(user_id))
            .single();

        if (alumniError || !alumni) {
            console.error('Alumni fetch error:', alumniError);
            return res.status(404).json({ message: 'Alumni profile not found' });
        }

        console.log('✅ Found alumni:', alumni);

        // Insert job with alumni name
        const { data: job, error: insertError } = await supabase
            .from('jobs')
            .insert([{
                title,
                company,
                application_link,
                posted_by: alumni.alumni_id,
                posted_by_name: alumni.full_name,
                status: 'active'
            }])
            .select()
            .single();

        if (insertError) {
            console.error('❌ Insert error:', insertError);
            return res.status(500).json({ message: 'Error posting job', error: insertError.message });
        }

        console.log('✅ Job posted successfully:', job);

        // ===== SEND EMAIL NOTIFICATION TO ALL STUDENTS =====
        try {
            // Get all registered students
            const { data: students, error: studentsError } = await supabase
                .from('students')
                .select('email, full_name');

            if (studentsError) {
                console.error('❌ Error fetching students:', studentsError);
            } else if (students && students.length > 0) {
                console.log(`📧 Sending job notification to ${students.length} students via BCC...`);
                
                // Check if email function exists
                if (typeof sendNewJobNotificationToAll === 'function') {
                    await sendNewJobNotificationToAll(
                        students,
                        job.title,
                        job.company,
                        alumni.full_name,
                        job.application_link
                    );
                    console.log('✅ Job notification emails sent successfully (BCC)');
                } else {
                    console.error('❌ sendNewJobNotificationToAll function not found!');
                }
            } else {
                console.log('⚠️ No students found to send notifications');
            }
        } catch (emailError) {
            console.error('❌ Email notification failed:', emailError.message);
            console.error('Full error:', emailError);
            // Don't block the response - job is still posted
        }

        res.status(201).json({ 
            message: 'Job posted successfully!', 
            job: job 
        });

    } catch (error) {
        console.error('Post job error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/jobs/my-jobs - Get all jobs posted by this alumni
const getMyJobs = async (req, res) => {
    try {
        const { user_id } = req.query;

        if (!user_id) {
            return res.status(400).json({ message: 'user_id is required' });
        }

        // Get alumni_id using helper
        const alumniId = await getAlumniId(user_id);
        if (!alumniId) {
            return res.status(404).json({ message: 'Alumni profile not found' });
        }

        const { data: jobs, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('posted_by', alumniId)
            .order('posted_date', { ascending: false });

        if (error) {
            console.error('Error fetching jobs:', error);
            return res.status(500).json({ message: 'Error fetching jobs' });
        }

        res.json({ success: true, jobs: jobs || [], total: jobs?.length || 0 });

    } catch (error) {
        console.error('Get my jobs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/jobs/:jobId - Delete a job
const deleteJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { user_id } = req.body;

        const alumniId = await getAlumniId(user_id);
        if (!alumniId) {
            return res.status(404).json({ message: 'Alumni profile not found' });
        }

        // Verify job belongs to this alumni
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('id, posted_by')
            .eq('id', jobId)
            .single();

        if (jobError || !job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        if (job.posted_by !== alumniId) {
            return res.status(403).json({ message: 'You can only delete your own jobs' });
        }

        // Soft delete - update status to closed
        const { error: updateError } = await supabase
            .from('jobs')
            .update({ status: 'closed' })
            .eq('id', jobId);

        if (updateError) {
            console.error('Error deleting job:', updateError);
            return res.status(500).json({ message: 'Error deleting job' });
        }

        res.json({ message: 'Job deleted successfully' });

    } catch (error) {
        console.error('Delete job error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/jobs - Get all active jobs (for students)
const getJobs = async (req, res) => {
    try {
        const { data: jobs, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('status', 'active')
            .order('posted_date', { ascending: false });

        if (error) {
            console.error('Error fetching jobs:', error);
            return res.status(500).json({ message: 'Error fetching jobs' });
        }

        res.json({ success: true, jobs: jobs || [] });

    } catch (error) {
        console.error('Get jobs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/jobs/:jobId - Get single job details
const getJobById = async (req, res) => {
    try {
        const { jobId } = req.params;

        const { data: job, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', jobId)
            .single();

        if (error || !job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        res.json({ success: true, job });

    } catch (error) {
        console.error('Get job by id error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    postJob,
    getMyJobs,
    deleteJob,
    getJobs,
    getJobById
};