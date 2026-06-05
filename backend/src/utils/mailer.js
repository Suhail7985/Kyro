const nodemailer = require('nodemailer');

const isMailConfigured = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

let transporter = null;

if (isMailConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Send an email notification.
 * Falls back to console logging if mailer is not configured.
 */
async function sendEmail({ to, subject, text, html }) {
  const from = process.env.SMTP_FROM || 'no-reply@hiringplatform.com';
  
  if (isMailConfigured && transporter) {
    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });
      console.log(`Email sent successfully: ${info.messageId}`);
      return info;
    } catch (err) {
      console.error(`Failed to send email to ${to}:`, err.message);
    }
  } else {
    console.log('--- MAIL SIMULATION ---');
    console.log(`To: ${to}`);
    console.log(`From: ${from}`);
    console.log(`Subject: ${subject}`);
    console.log(`Text Body:\n${text}`);
    if (html) {
      console.log(`HTML Body Snippet:\n${html.slice(0, 300)}...`);
    }
    console.log('-----------------------');
    return { messageId: 'simulated_mail_id_' + Math.random().toString(36).slice(-8) };
  }
}

module.exports = {
  sendEmail,
  isMailConfigured: () => isMailConfigured,
};
