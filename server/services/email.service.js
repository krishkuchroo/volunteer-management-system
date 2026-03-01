// Email service - stub implementation
// In production, replace with nodemailer + SMTP or a provider like SendGrid/Resend

async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

  if (process.env.NODE_ENV === 'development') {
    console.log(`\n[EMAIL] Password reset for ${email}`);
    console.log(`[EMAIL] Reset URL: ${resetUrl}\n`);
    return;
  }

  // Production: wire up your email provider here
  // Example with nodemailer:
  // const transporter = nodemailer.createTransport({ ... });
  // await transporter.sendMail({
  //   from: process.env.EMAIL_FROM,
  //   to: email,
  //   subject: 'Password Reset Request',
  //   html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 1 hour.</p>`,
  // });
}

async function sendWelcomeEmail(email, firstName) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n[EMAIL] Welcome email for ${firstName} <${email}>\n`);
    return;
  }
  // Production implementation here
}

module.exports = { sendPasswordResetEmail, sendWelcomeEmail };
