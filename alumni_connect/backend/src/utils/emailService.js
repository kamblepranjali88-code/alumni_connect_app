// Email service
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ===== SEND LOGIN CREDENTIALS =====
const sendCredentials = async (email, userId, password, fullName) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Alumni Connect Login Credentials',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                <div style="background: #2563eb; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h2 style="color: white; margin: 0;">Welcome to Alumni Connect!</h2>
                </div>
                <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
                    <p style="color: #374151;">Hi <strong>${fullName}</strong>,</p>
                    <p style="color: #374151;">Your registration has been verified. Here are your login credentials:</p>
                    <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 16px 0;">
                        <p style="margin: 0 0 8px 0;"><strong>User ID:</strong> <span style="color: #2563eb; font-family: monospace;">${userId}</span></p>
                        <p style="margin: 0;"><strong>Temporary Password:</strong> <span style="color: #2563eb; font-family: monospace;">${password}</span></p>
                    </div>
                    <p style="color: #374151;"><strong>Important:</strong></p>
                    <ul style="color: #374151;">
                        <li>You will be asked to change your password on first login</li>
                        <li>Your User ID cannot be changed</li>
                        <li>Keep your credentials safe</li>
                    </ul>
                    <div style="text-align: center; margin-top: 20px;">
                        <a href="http://localhost:5000/html/login.html"
                           style="background: #2563eb; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                            Login Now
                        </a>
                    </div>
                </div>
            </div>
        `
    };
    await transporter.sendMail(mailOptions);
};

// ===== SEND REQUEST NOTIFICATION TO ALUMNI =====
const sendRequestNotification = async (alumniEmail, alumniName, studentName, studentBranch, studentYear, message) => {
    const loginWithRedirect = `http://localhost:5000/html/login.html?redirect=mentorship-requests.html`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: alumniEmail,
        subject: `New Mentorship Request from ${studentName} | Alumni Connect`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                <div style="background: #2563eb; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h2 style="color: white; margin: 0;">🎓 New Mentorship Request</h2>
                </div>
                <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
                    <p style="color: #374151;">Hi <strong>${alumniName}</strong>,</p>
                    <p style="color: #374151;">You have received a new mentorship request!</p>
                    <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 16px 0;">
                        <p style="margin: 0 0 6px 0;"><strong>Student:</strong> ${studentName}</p>
                        <p style="margin: 0 0 6px 0;"><strong>Branch:</strong> ${studentBranch}</p>
                        <p style="margin: 0;"><strong>Year:</strong> ${studentYear}</p>
                    </div>
                    <div style="background: #eff6ff; padding: 14px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 16px 0;">
                        <p style="margin: 0 0 6px 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">Message from student</p>
                        <p style="margin: 0; color: #1e293b; font-style: italic;">"${message}"</p>
                    </div>
                    <div style="background: #f0fdf4; padding: 14px; border-radius: 8px; border: 1px solid #bbf7d0; margin: 16px 0;">
                        <p style="margin: 0 0 8px 0; font-weight: bold; color: #16a34a;">📋 Connection Rules</p>
                        <ul style="margin: 0; padding-left: 18px; color: #374151; font-size: 13px;">
                            <li>Connection lasts <strong>15 days</strong> after acceptance</li>
                            <li>Student cannot change mentor during active connection</li>
                            <li>Student can have maximum 2 active mentors at a time</li>
                        </ul>
                    </div>
                    <div style="text-align: center; margin-top: 20px;">
                        <a href="${loginWithRedirect}"
                           style="background: #2563eb; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                            View Request
                        </a>
                    </div>
                    <p style="text-align: center; margin-top: 12px; font-size: 12px; color: #9ca3af;">
                        Click "View Request" to login and respond
                    </p>
                </div>
            </div>
        `
    };
    await transporter.sendMail(mailOptions);
};

// ===== SEND ACCEPT NOTIFICATION TO STUDENT =====
const sendAcceptNotification = async (studentEmail, studentName, alumniName, alumniCompany, alumniDesignation, expiresAt) => {
    const expiryDate    = new Date(expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const loginRedirect = `http://localhost:5000/html/login.html?redirect=student-dashboard.html`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: studentEmail,
        subject: `✅ Mentorship Request Accepted by ${alumniName} | Alumni Connect`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                <div style="background: #16a34a; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h2 style="color: white; margin: 0;">🎉 Request Accepted!</h2>
                </div>
                <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
                    <p style="color: #374151;">Hi <strong>${studentName}</strong>,</p>
                    <p style="color: #374151;">Great news! Your mentorship request has been <strong style="color: #16a34a;">accepted</strong>.</p>
                    <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 16px 0;">
                        <p style="margin: 0 0 6px 0;"><strong>Mentor:</strong> ${alumniName}</p>
                        <p style="margin: 0 0 6px 0;"><strong>Company:</strong> ${alumniCompany || 'Not specified'}</p>
                        <p style="margin: 0;"><strong>Designation:</strong> ${alumniDesignation || 'Not specified'}</p>
                    </div>
                    <div style="background: #eff6ff; padding: 14px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 16px 0;">
                        <p style="margin: 0 0 8px 0; font-weight: bold; color: #2563eb;">📋 Connection Rules</p>
                        <ul style="margin: 0; padding-left: 18px; color: #374151; font-size: 13px;">
                            <li>Connection is active until <strong>${expiryDate}</strong> (15 days)</li>
                            <li>You <strong>cannot change</strong> this mentor during the connection period</li>
                            <li>You can have maximum <strong>2 active mentors</strong> at a time</li>
                            <li>After connection ends, you can connect with a new mentor</li>
                        </ul>
                    </div>
                    <div style="text-align: center; margin-top: 20px;">
                        <a href="${loginRedirect}"
                           style="background: #16a34a; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                            View My Requests
                        </a>
                    </div>
                </div>
            </div>
        `
    };
    await transporter.sendMail(mailOptions);
};

// ===== SEND REJECT NOTIFICATION TO STUDENT =====
const sendRejectNotification = async (studentEmail, studentName, alumniName) => {
    const loginRedirect = `http://localhost:5000/html/login.html?redirect=search-alumni.html`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: studentEmail,
        subject: `Mentorship Request Update | Alumni Connect`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                <div style="background: #dc2626; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h2 style="color: white; margin: 0;">Request Update</h2>
                </div>
                <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
                    <p style="color: #374151;">Hi <strong>${studentName}</strong>,</p>
                    <p style="color: #374151;">Your mentorship request to <strong>${alumniName}</strong> was not accepted this time.</p>
                    <div style="background: #eff6ff; padding: 14px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 16px 0;">
                        <p style="margin: 0 0 8px 0; font-weight: bold; color: #2563eb;">💡 What's Next?</p>
                        <ul style="margin: 0; padding-left: 18px; color: #374151; font-size: 13px;">
                            <li>A slot has opened up — you can send a new request</li>
                            <li>Browse other alumni and find a mentor that matches your goals</li>
                            <li>Remember you can have up to <strong>2 active mentors</strong> at a time</li>
                        </ul>
                    </div>
                    <div style="text-align: center; margin-top: 20px;">
                        <a href="${loginRedirect}"
                           style="background: #2563eb; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                            Find Another Mentor
                        </a>
                    </div>
                </div>
            </div>
        `
    };
    await transporter.sendMail(mailOptions);
};
// ===== SEND NEW JOB NOTIFICATION TO ALL STUDENTS (BCC) =====
const sendNewJobNotificationToAll = async (students, jobTitle, companyName, alumniName, applicationLink) => {
    // Extract all student emails for BCC
    const bccEmails = students.map(s => s.email);
    
    const loginRedirect = `http://localhost:5000/html/login.html?redirect=student-dashboard.html`;

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

module.exports = {
    sendCredentials,
    sendRequestNotification,
    sendAcceptNotification,
    sendRejectNotification,
    sendNewJobNotificationToAll  
};