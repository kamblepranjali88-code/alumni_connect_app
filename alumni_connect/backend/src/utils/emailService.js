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

const sendCredentials = async (email, userId, password, fullName) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Alumni Connect Login Credentials',
        html: `
            <h2>Welcome to Alumni Connect, ${fullName}!</h2>
            <p>Your registration request has been approved.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
                <p><strong>User ID:</strong> ${userId}</p>
                <p><strong>Temporary Password:</strong> ${password}</p>
            </div>
            <p><strong>Important Instructions:</strong></p>
            <ul>
                <li>Login with these credentials</li>
                <li>You will be asked to change password on first login</li>
                <li>Your User ID cannot be changed</li>
            </ul>
            <p>Login here: http://localhost:5000/login.html</p>
        `
    };

    await transporter.sendMail(mailOptions);
};

module.exports = { sendCredentials };
