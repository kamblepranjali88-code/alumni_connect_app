require('dotenv').config();

const sendEmail = async (to, subject, htmlContent, replyTo = null) => {


    console.log(`📧 Sending "${subject}" to: ${to}`);
    console.log(`📧 Using sender: ${process.env.BREVO_USER}`);
    console.log(`📧 API Key exists: ${!!process.env.BREVO_API_KEY}`);

    const body = {
        sender: { email: process.env.BREVO_USER },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent
    };
    if (replyTo) body.replyTo = { email: replyTo };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY,
            'content-type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Brevo API error for ${to}:`, error);
        throw new Error(`Brevo API error: ${error}`);
    }

    const result = await response.json();
    console.log(`✅ Email sent successfully to ${to}. Message ID:`, result.messageId);
    return result;
};

const sendCredentials = async (email, userId, password, fullName) => {
    console.log('📧 sendCredentials called for:', email);
    try {
        await sendEmail(email, 'Your Alumni Connect Login Credentials', `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
            <div style="background:#2563eb;padding:24px;border-radius:12px 12px 0 0;text-align:center">
                <h2 style="color:white;margin:0">Welcome to Alumni Connect!</h2>
            </div>
            <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
                <p>Hi <strong>${fullName}</strong>, your registration has been verified.</p>
                <div style="background:white;padding:16px;border-radius:8px;border:1px solid #e5e7eb;margin:16px 0">
                    <p style="margin:0 0 8px"><strong>User ID:</strong> <span style="color:#2563eb;font-family:monospace">${userId}</span></p>
                    <p style="margin:0"><strong>Temp Password:</strong> <span style="color:#2563eb;font-family:monospace">${password}</span></p>
                </div>
                <div style="text-align:center;margin-top:20px">
                    <a href="https://alumni-connect-app-3udd.vercel.app/login.html"
                       style="background:#2563eb;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Login Now</a>
                </div>
            </div>
        </div>`);
        console.log('✅ Credentials email sent to:', email);
    } catch (err) {
        console.error('❌ sendCredentials failed:', err.message);
    }
};

const sendRequestNotification = async (alumniEmail, alumniName, studentName, studentBranch, studentYear, message) => {
    console.log('📧 sendRequestNotification called for:', alumniEmail);
    try {
        await sendEmail(alumniEmail, `New Mentorship Request from ${studentName} | Alumni Connect`, `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
            <div style="background:#2563eb;padding:24px;border-radius:12px 12px 0 0;text-align:center">
                <h2 style="color:white;margin:0">New Mentorship Request</h2>
            </div>
            <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
                <p>Hi <strong>${alumniName}</strong>, you have a new mentorship request!</p>
                <p><strong>Student:</strong> ${studentName}</p>
                <p><strong>Branch:</strong> ${studentBranch}</p>
                <p><strong>Year:</strong> ${studentYear}</p>
                <p style="font-style:italic">"${message}"</p>
                <div style="text-align:center;margin-top:20px">
                    <a href="https://alumni-connect-app-3udd.vercel.app/login.html?redirect=mentorship-requests.html"
                       style="background:#2563eb;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">View Request</a>
                </div>
            </div>
        </div>`);
        console.log('✅ Request notification sent to:', alumniEmail);
    } catch (err) {
        console.error('❌ sendRequestNotification failed:', err.message);
    }
};

const sendAcceptNotification = async (studentEmail, studentName, alumniName, alumniCompany, alumniDesignation, expiresAt) => {
    console.log('📧 sendAcceptNotification called for:', studentEmail);
    try {
        const expiryDate = new Date(expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
        await sendEmail(studentEmail, `Mentorship Request Accepted by ${alumniName} | Alumni Connect`, `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
            <div style="background:#16a34a;padding:24px;border-radius:12px 12px 0 0;text-align:center">
                <h2 style="color:white;margin:0">Request Accepted! 🎉</h2>
            </div>
            <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
                <p>Hi <strong>${studentName}</strong>, your request has been accepted!</p>
                <p><strong>Mentor:</strong> ${alumniName}</p>
                <p><strong>Company:</strong> ${alumniCompany || 'Not specified'}</p>
                <p><strong>Active until:</strong> ${expiryDate}</p>
                <div style="text-align:center;margin-top:20px">
                    <a href="https://alumni-connect-app-3udd.vercel.app/login.html?redirect=student-dashboard.html"
                       style="background:#16a34a;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Go to Dashboard</a>
                </div>
            </div>
        </div>`);
        console.log('✅ Accept notification sent to:', studentEmail);
    } catch (err) {
        console.error('❌ sendAcceptNotification failed:', err.message);
    }
};

const sendRejectNotification = async (studentEmail, studentName, alumniName) => {
    console.log('📧 sendRejectNotification called for:', studentEmail);
    try {
        await sendEmail(studentEmail, `Mentorship Request Update | Alumni Connect`, `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
            <div style="background:#dc2626;padding:24px;border-radius:12px 12px 0 0;text-align:center">
                <h2 style="color:white;margin:0">Request Update</h2>
            </div>
            <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
                <p>Hi <strong>${studentName}</strong>, your request to <strong>${alumniName}</strong> was not accepted this time.</p>
                <p>Don't worry — you can connect with other alumni!</p>
                <div style="text-align:center;margin-top:20px">
                    <a href="https://alumni-connect-app-3udd.vercel.app/login.html?redirect=search-alumni.html"
                       style="background:#2563eb;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Find Another Mentor</a>
                </div>
            </div>
        </div>`);
        console.log('✅ Reject notification sent to:', studentEmail);
    } catch (err) {
        console.error('❌ sendRejectNotification failed:', err.message);
    }
};

const sendFirstMessageNotification = async ({ alumniEmail, alumniName, studentName, studentEmail, messagePreview, sessionNumber }) => {
    console.log('📧 sendFirstMessageNotification called for:', alumniEmail);
    try {
        const nth = sessionNumber === 1 ? '1st' : sessionNumber === 2 ? '2nd' : sessionNumber === 3 ? '3rd' : `${sessionNumber}th`;
        await sendEmail(alumniEmail, `${studentName} wants to chat (Session ${sessionNumber}) | Alumni Connect`, `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
            <div style="background:#2563eb;padding:28px 24px;border-radius:12px 12px 0 0;text-align:center">
                <h2 style="color:white;margin:0">Chat Session ${sessionNumber} Request</h2>
            </div>
            <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
                <p>Hi <strong>${alumniName}</strong>, <strong>${studentName}</strong> has sent you a message!</p>
                <p style="font-style:italic">"${messagePreview}"</p>
                <p>Reply to: <a href="mailto:${studentEmail}">${studentEmail}</a></p>
                <div style="text-align:center;margin-top:20px">
                    <a href="https://alumni-connect-app-3udd.vercel.app/login.html"
                       style="background:#2563eb;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Open Chat</a>
                </div>
            </div>
        </div>`, studentEmail);
        console.log(`✅ Session ${sessionNumber} notification sent to:`, alumniEmail);
    } catch (err) {
        console.error('❌ sendFirstMessageNotification failed:', err.message);
    }
};

const sendNewJobNotificationToAll = async (students, jobTitle, companyName, alumniName, applicationLink) => {
    console.log(`📧 sendNewJobNotificationToAll called for ${students.length} students`);
    for (const student of students) {
        try {
            await sendEmail(student.email, `New Job: ${jobTitle} at ${companyName} | Alumni Connect`, `
            <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
                <div style="background:#2563eb;padding:24px;border-radius:12px 12px 0 0;text-align:center">
                    <h2 style="color:white;margin:0">New Job Opportunity! 💼</h2>
                </div>
                <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
                    <p>Hi <strong>${student.full_name || 'Student'}</strong>,</p>
                    <p><strong>${jobTitle}</strong> at <strong>${companyName}</strong></p>
                    <p>Posted by: ${alumniName}</p>
                    <div style="text-align:center;margin:20px 0">
                        <a href="${applicationLink}"
                           style="background:#16a34a;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Apply Now</a>
                    </div>
                </div>
            </div>`);
            console.log('✅ Job notification sent to:', student.email);
        } catch (err) {
            console.error('❌ Job notification failed for:', student.email, err.message);
        }
    }
};

const sendEventNotification = async ({ toEmail, toName, eventTitle, eventDate, eventMode, eventDesc, deadline }) => {
    console.log('📧 sendEventNotification called for:', toEmail);
    try {
        const dateStr = new Date(eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
        const deadlineStr = new Date(deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
        const modeColor = eventMode === 'Online' ? '#2563eb' : '#16a34a';
        await sendEmail(toEmail, `New Event: ${eventTitle} | Alumni Connect`, `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
            <div style="background:#2563eb;padding:24px;border-radius:12px 12px 0 0;text-align:center">
                <h2 style="color:white;margin:0">New Event Announced! 📅</h2>
            </div>
            <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
                <p>Hi <strong>${toName}</strong>,</p>
                <h3 style="color:#2563eb">${eventTitle}</h3>
                <p><strong>Date:</strong> ${dateStr}</p>
                <p><strong>Mode:</strong> <span style="background:${modeColor};color:white;padding:2px 10px;border-radius:12px">${eventMode}</span></p>
                <p><strong>Register by:</strong> ${deadlineStr}</p>
                <p>${eventDesc}</p>
                <div style="text-align:center;margin-top:20px">
                    <a href="https://alumni-connect-app-3udd.vercel.app/events.html"
                       style="background:#2563eb;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">View & Register</a>
                </div>
            </div>
        </div>`);
        console.log('✅ Event notification sent to:', toEmail);
    } catch (err) {
        console.error('❌ sendEventNotification failed:', err.message);
    }
};

module.exports = {
    sendCredentials,
    sendRequestNotification,
    sendAcceptNotification,
    sendRejectNotification,
    sendFirstMessageNotification,
    sendEventNotification,
    sendNewJobNotificationToAll
};