const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

const sendCredentials = async (email, userId, password, fullName) => {
    await transporter.sendMail({
        from: process.env.EMAIL_USER, to: email,
        subject: 'Your Alumni Connect Login Credentials',
        html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
            <div style="background:#2563eb;padding:24px;border-radius:12px 12px 0 0;text-align:center">
                <h2 style="color:white;margin:0">Welcome to Alumni Connect!</h2></div>
            <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
                <p>Hi <strong>${fullName}</strong>, your registration has been verified.</p>
                <div style="background:white;padding:16px;border-radius:8px;border:1px solid #e5e7eb;margin:16px 0">
                    <p style="margin:0 0 8px"><strong>User ID:</strong> <span style="color:#2563eb;font-family:monospace">${userId}</span></p>
                    <p style="margin:0"><strong>Temp Password:</strong> <span style="color:#2563eb;font-family:monospace">${password}</span></p>
                </div>
                <div style="text-align:center;margin-top:20px">
                    <a href="https://alumni-connect-app-3udd.vercel.app/login.html"
                       style="background:#2563eb;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Login Now</a>
                </div></div></div>`
    });
};

const sendRequestNotification = async (alumniEmail, alumniName, studentName, studentBranch, studentYear, message) => {
    await transporter.sendMail({
        from: process.env.EMAIL_USER, to: alumniEmail,
        subject: `New Mentorship Request from ${studentName} | Alumni Connect`,
        html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
            <div style="background:#2563eb;padding:24px;border-radius:12px 12px 0 0;text-align:center">
                <h2 style="color:white;margin:0">🎓 New Mentorship Request</h2></div>
            <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
                <p>Hi <strong>${alumniName}</strong>, you have a new mentorship request!</p>
                <div style="background:white;padding:16px;border-radius:8px;border:1px solid #e5e7eb;margin:16px 0">
                    <p style="margin:0 0 6px"><strong>Student:</strong> ${studentName}</p>
                    <p style="margin:0 0 6px"><strong>Branch:</strong> ${studentBranch}</p>
                    <p style="margin:0"><strong>Year:</strong> ${studentYear}</p></div>
                <div style="background:#eff6ff;padding:14px;border-radius:8px;border-left:4px solid #2563eb;margin:16px 0">
                    <p style="margin:0 0 6px;font-size:12px;color:#6b7280;text-transform:uppercase">Message</p>
                    <p style="margin:0;color:#1e293b;font-style:italic">"${message}"</p></div>
                <div style="text-align:center;margin-top:20px">
                    <a href="https://alumni-connect-app-3udd.vercel.app/login.html?redirect=mentorship-requests.html"
                       style="background:#2563eb;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">View Request</a>
                </div></div></div>`
    });
};

const sendAcceptNotification = async (studentEmail, studentName, alumniName, alumniCompany, alumniDesignation, expiresAt) => {
    const expiryDate = new Date(expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    await transporter.sendMail({
        from: process.env.EMAIL_USER, to: studentEmail,
        subject: `✅ Mentorship Request Accepted by ${alumniName} | Alumni Connect`,
        html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
            <div style="background:#16a34a;padding:24px;border-radius:12px 12px 0 0;text-align:center">
                <h2 style="color:white;margin:0">🎉 Request Accepted!</h2></div>
            <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
                <p>Hi <strong>${studentName}</strong>, your request has been <strong style="color:#16a34a">accepted</strong>!</p>
                <div style="background:white;padding:16px;border-radius:8px;border:1px solid #e5e7eb;margin:16px 0">
                    <p style="margin:0 0 6px"><strong>Mentor:</strong> ${alumniName}</p>
                    <p style="margin:0 0 6px"><strong>Company:</strong> ${alumniCompany || 'Not specified'}</p>
                    <p style="margin:0"><strong>Active until:</strong> ${expiryDate}</p></div>
                <div style="text-align:center;margin-top:20px">
                    <a href="https://alumni-connect-app-3udd.vercel.app/login.html?redirect=student-dashboard.html"
                       style="background:#16a34a;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Go to Dashboard</a>
                </div></div></div>`
    });
};

const sendRejectNotification = async (studentEmail, studentName, alumniName) => {
    await transporter.sendMail({
        from: process.env.EMAIL_USER, to: studentEmail,
        subject: `Mentorship Request Update | Alumni Connect`,
        html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
            <div style="background:#dc2626;padding:24px;border-radius:12px 12px 0 0;text-align:center">
                <h2 style="color:white;margin:0">Request Update</h2></div>
            <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
                <p>Hi <strong>${studentName}</strong>, your request to <strong>${alumniName}</strong> was not accepted.</p>
                <div style="text-align:center;margin-top:20px">
                    <a href="https://alumni-connect-app-3udd.vercel.app/login.html?redirect=search-alumni.html"
                       style="background:#2563eb;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Find Another Mentor</a>
                </div></div></div>`
    });
};

// ── NEW: First message of a session → email alumni with Reply-To = student email
const sendFirstMessageNotification = async ({
    alumniEmail, alumniName, studentName, studentEmail, messagePreview, sessionNumber
}) => {
    const nth = sessionNumber === 1 ? '1st' : sessionNumber === 2 ? '2nd' : sessionNumber === 3 ? '3rd' : `${sessionNumber}th`;

    await transporter.sendMail({
        from:    `"Alumni Connect" <${process.env.EMAIL_USER}>`,
        to:      alumniEmail,
        replyTo: studentEmail,   // ← alumni hits Reply → goes straight to student's email
        subject: `💬 ${studentName} wants to chat (Session ${sessionNumber}) | Alumni Connect`,
        html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">

            <div style="background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:28px 24px;border-radius:12px 12px 0 0;text-align:center">
                <h2 style="color:white;margin:0;font-size:22px">💬 Chat Session ${sessionNumber} Request</h2>
                <p style="color:#bfdbfe;margin:8px 0 0;font-size:14px">Your mentee wants to start their ${nth} chat session</p>
            </div>

            <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
                <p style="color:#374151;margin:0 0 16px">Hi <strong>${alumniName}</strong>,</p>
                <p style="color:#374151;margin:0 0 20px">
                    <strong>${studentName}</strong> has sent you a message and wants to schedule
                    their <strong>${nth} chat session</strong> with you.
                </p>

                <div style="background:white;padding:16px;border-radius:8px;border:1px solid #e5e7eb;border-left:4px solid #2563eb;margin:0 0 20px">
                    <p style="margin:0 0 8px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px">
                        Session ${sessionNumber} — Message from ${studentName}
                    </p>
                    <p style="margin:0;color:#1e293b;font-style:italic;font-size:15px">"${messagePreview}"</p>
                </div>

                <div style="background:#f0fdf4;padding:16px;border-radius:8px;border:1px solid #bbf7d0;margin:0 0 20px">
                    <p style="margin:0 0 12px;font-weight:bold;color:#15803d;font-size:14px">✅ How to respond — no login needed</p>
                    <div style="background:white;border-radius:6px;padding:10px 14px;margin-bottom:8px;border:1px solid #dcfce7">
                        <span style="color:#16a34a;font-weight:bold;margin-right:8px">1.</span>
                        <span style="color:#374151">Click <strong>Reply</strong> on this email</span>
                    </div>
                    <div style="background:white;border-radius:6px;padding:10px 14px;margin-bottom:8px;border:1px solid #dcfce7">
                        <span style="color:#16a34a;font-weight:bold;margin-right:8px">2.</span>
                        <span style="color:#374151">Tell <strong>${studentName}</strong> what time you are free to chat</span>
                    </div>
                    <div style="background:white;border-radius:6px;padding:10px 14px;margin-bottom:8px;border:1px solid #dcfce7">
                        <span style="color:#16a34a;font-weight:bold;margin-right:8px">3.</span>
                        <span style="color:#374151">Your reply goes <strong>directly to their email</strong> — no website needed</span>
                    </div>
                    <div style="background:white;border-radius:6px;padding:10px 14px;border:1px solid #dcfce7">
                        <span style="color:#16a34a;font-weight:bold;margin-right:8px">4.</span>
                        <span style="color:#374151">At the agreed time, both log in to Alumni Connect and chat!</span>
                    </div>
                </div>

                <div style="background:#eff6ff;padding:14px;border-radius:8px;border:1px solid #bfdbfe;margin:0 0 20px">
                    <p style="margin:0 0 4px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Replying to this email will contact</p>
                    <p style="margin:0;color:#1d4ed8;font-weight:600;font-size:15px">📧 ${studentName} &lt;${studentEmail}&gt;</p>
                </div>

                <p style="color:#9ca3af;font-size:11px;text-align:center;margin:0">
                    Alumni Connect · Session ${sessionNumber} of mentorship with ${studentName}
                </p>
            </div>
        </div>`
    });

    console.log(`[Email] Session ${sessionNumber} notification → ${alumniEmail} | reply-to: ${studentEmail}`);
};
// ===== SEND NEW JOB NOTIFICATION TO ALL STUDENTS (BCC) =====
const sendNewJobNotificationToAll = async (students, jobTitle, companyName, alumniName, applicationLink) => {
    // Extract all student emails for BCC
    const bccEmails = students.map(s => s.email);
    
    const loginRedirect = `https://alumni-connect-app-3udd.vercel.app/login.html?redirect=student-dashboard.html`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        bcc: bccEmails,  // BCC all students
        subject: `💼 New Job Opportunity: ${jobTitle} at ${companyName} | Alumni Connect`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                <div style="background: #2563eb; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h2 style="color: white; margin: 0;">🎯 New Job Opportunity!</h2>
                </div>
                <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
                    <p style="color: #374151;">Hello <strong>Student</strong>,</p>
                    <p style="color: #374151;">An alumnus has shared a new job opportunity exclusively for our college community!</p>
                    
                    <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 16px 0;">
                        <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: bold; color: #1e293b;">${jobTitle}</p>
                        <p style="margin: 0 0 6px 0; color: #2563eb; font-weight: 500;">🏢 ${companyName}</p>
                        <p style="margin: 0; color: #64748b; font-size: 13px;">👤 Posted by: ${alumniName} (Alumni)</p>
                    </div>

                    <div style="background: #eff6ff; padding: 14px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 16px 0;">
                        <p style="margin: 0 0 8px 0; font-weight: bold; color: #2563eb;">📌 Quick Tips</p>
                        <ul style="margin: 0; padding-left: 18px; color: #374151; font-size: 13px;">
                            <li>Read the job description carefully before applying</li>
                            <li>Customize your resume for this specific role</li>
                            <li>You can reach out to the alumni for referral if needed</li>
                            <li>Apply as early as possible — opportunities fill fast!</li>
                        </ul>
                    </div>

                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${applicationLink}"
                           style="background: #16a34a; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                            Apply Now →
                        </a>
                    </div>

                    <div style="background: #fef3c7; padding: 12px; border-radius: 8px; margin: 16px 0;">
                        <p style="margin: 0; font-size: 12px; color: #92400e; text-align: center;">
                            ⚡ This link will take you to the company's official application page.
                        </p>
                    </div>

                    <div style="text-align: center; margin-top: 20px;">
                        <a href="${loginRedirect}"
                           style="color: #2563eb; text-decoration: none; font-size: 13px;">
                            View all jobs on your dashboard →
                        </a>
                    </div>

                    <p style="text-align: center; margin-top: 20px; font-size: 11px; color: #9ca3af;">
                        You're receiving this because you're a registered student at Tech University.
                    </p>
                </div>
            </div>
        `
    };
    
    await transporter.sendMail(mailOptions);
};

const sendEventNotification = async ({
    toEmail, toName, eventTitle, eventDate, eventMode, eventDesc, deadline
}) => {
    const dateStr     = new Date(eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const deadlineStr = new Date(deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const modeColor   = eventMode === 'Online' ? '#2563eb' : '#16a34a';
    const eventsLink  = `https://alumni-connect-app-3udd.vercel.app/events.html`;
 
    await transporter.sendMail({
        from:    `"Alumni Connect" <${process.env.EMAIL_USER}>`,
        to:      toEmail,
        subject: `🎉 New Event: ${eventTitle} | Alumni Connect`,
        html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
            <div style="background:#2563eb;padding:24px;border-radius:12px 12px 0 0;text-align:center">
                <h2 style="color:white;margin:0">🎉 New Event Announced!</h2>
            </div>
            <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
                <p style="color:#374151">Hi <strong>${toName}</strong>,</p>
                <p style="color:#374151;margin-bottom:20px">A new event has been added to Alumni Connect. Register before the deadline!</p>
 
                <div style="background:white;padding:20px;border-radius:10px;border:1px solid #e5e7eb;margin-bottom:20px">
                    <h3 style="color:#1e293b;margin:0 0 12px">${eventTitle}</h3>
                    <p style="color:#6b7280;font-size:14px;margin:0 0 8px">
                        📅 <strong>Date:</strong> ${dateStr}
                    </p>
                    <p style="color:#6b7280;font-size:14px;margin:0 0 8px">
                        🏷️ <strong>Mode:</strong>
                        <span style="background:${modeColor};color:white;padding:2px 10px;border-radius:12px;font-size:12px">${eventMode}</span>
                    </p>
                    <p style="color:#6b7280;font-size:14px;margin:0 0 12px">
                        ⏰ <strong>Register by:</strong> ${deadlineStr}
                    </p>
                    <p style="color:#374151;font-size:14px;border-left:3px solid #2563eb;padding-left:12px;margin:0">
                        ${eventDesc}
                    </p>
                </div>
 
                <div style="text-align:center">
                    <a href="${eventsLink}"
                       style="background:#2563eb;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
                        View & Register
                    </a>
                </div>
                <p style="text-align:center;margin-top:16px;font-size:11px;color:#9ca3af">
                    Alumni Connect · Tech University
                </p>
            </div>
        </div>`
    });
};

module.exports = {
    sendCredentials,
    sendRequestNotification,
    sendAcceptNotification,
    sendRejectNotification,
    sendFirstMessageNotification,
    sendEventNotification,
    sendNewJobNotificationToAll,
    sendFirstMessageNotification
};