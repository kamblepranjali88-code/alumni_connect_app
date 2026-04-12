const SibApiV3Sdk = require('@getbrevo/brevo');
require('dotenv').config();

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
apiInstance.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY;

const sendEmail = async (to, subject, htmlContent, replyTo = null) => {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.sender = { email: process.env.BREVO_USER };
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    if (replyTo) sendSmtpEmail.replyTo = { email: replyTo };
    return apiInstance.sendTransacEmail(sendSmtpEmail);
};

const sendCredentials = async (email, userId, password, fullName) => {
    await sendEmail(email, 'Your Alumni Connect Login Credentials', `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
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
                </div></div></div>`);
};

const sendRequestNotification = async (alumniEmail, alumniName, studentName, studentBranch, studentYear, message) => {
    await sendEmail(alumniEmail, `New Mentorship Request from ${studentName} | Alumni Connect`, `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
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
                </div></div></div>`);
};

const sendAcceptNotification = async (studentEmail, studentName, alumniName, alumniCompany, alumniDesignation, expiresAt) => {
    const expiryDate = new Date(expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    await sendEmail(studentEmail, `✅ Mentorship Request Accepted by ${alumniName} | Alumni Connect`, `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
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
                </div></div></div>`);
};

const sendRejectNotification = async (studentEmail, studentName, alumniName) => {
    await sendEmail(studentEmail, `Mentorship Request Update | Alumni Connect`, `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
            <div style="background:#dc2626;padding:24px;border-radius:12px 12px 0 0;text-align:center">
                <h2 style="color:white;margin:0">Request Update</h2></div>
            <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
                <p>Hi <strong>${studentName}</strong>, your request to <strong>${alumniName}</strong> was not accepted.</p>
                <div style="text-align:center;margin-top:20px">
                    <a href="https://alumni-connect-app-3udd.vercel.app/login.html?redirect=search-alumni.html"
                       style="background:#2563eb;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Find Another Mentor</a>
                </div></div></div>`);
};

const sendFirstMessageNotification = async ({ alumniEmail, alumniName, studentName, studentEmail, messagePreview, sessionNumber }) => {
    const nth = sessionNumber === 1 ? '1st' : sessionNumber === 2 ? '2nd' : sessionNumber === 3 ? '3rd' : `${sessionNumber}th`;
    await sendEmail(alumniEmail, `💬 ${studentName} wants to chat (Session ${sessionNumber}) | Alumni Connect`, `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
            <div style="background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:28px 24px;border-radius:12px 12px 0 0;text-align:center">
                <h2 style="color:white;margin:0;font-size:22px">💬 Chat Session ${sessionNumber} Request</h2>
            </div>
            <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
                <p>Hi <strong>${alumniName}</strong>, <strong>${studentName}</strong> wants to chat!</p>
                <p style="font-style:italic">"${messagePreview}"</p>
                <p>Reply to this email to contact ${studentName} at ${studentEmail}</p>
            </div>
        </div>`, studentEmail);
    console.log(`[Email] Session ${sessionNumber} notification → ${alumniEmail}`);
};

const sendNewJobNotificationToAll = async (students, jobTitle, companyName, alumniName, applicationLink) => {
    for (const student of students) {
        await sendEmail(student.email, `💼 New Job: ${jobTitle} at ${companyName} | Alumni Connect`, `
            <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
                <div style="background:#2563eb;padding:24px;border-radius:12px 12px 0 0;text-align:center">
                    <h2 style="color:white;margin:0">🎯 New Job Opportunity!</h2>
                </div>
                <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
                    <p><strong>${jobTitle}</strong> at ${companyName}</p>
                    <p>Posted by: ${alumniName}</p>
                    <div style="text-align:center;margin:20px 0">
                        <a href="${applicationLink}" style="background:#16a34a;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Apply Now →</a>
                    </div>
                </div>
            </div>`);
    }
};

const sendEventNotification = async ({ toEmail, toName, eventTitle, eventDate, eventMode, eventDesc, deadline }) => {
    const dateStr = new Date(eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const deadlineStr = new Date(deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const modeColor = eventMode === 'Online' ? '#2563eb' : '#16a34a';
    await sendEmail(toEmail, `🎉 New Event: ${eventTitle} | Alumni Connect`, `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
            <div style="background:#2563eb;padding:24px;border-radius:12px 12px 0 0;text-align:center">
                <h2 style="color:white;margin:0">🎉 New Event Announced!</h2>
            </div>
            <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
                <p>Hi <strong>${toName}</strong>,</p>
                <h3>${eventTitle}</h3>
                <p>📅 Date: ${dateStr}</p>
                <p>🏷️ Mode: <span style="background:${modeColor};color:white;padding:2px 10px;border-radius:12px">${eventMode}</span></p>
                <p>⏰ Register by: ${deadlineStr}</p>
                <p>${eventDesc}</p>
                <div style="text-align:center">
                    <a href="https://alumni-connect-app-3udd.vercel.app/events.html"
                       style="background:#2563eb;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">View & Register</a>
                </div>
            </div>
        </div>`);
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