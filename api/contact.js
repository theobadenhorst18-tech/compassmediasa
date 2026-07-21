const nodemailer = require('nodemailer');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const { email = '', phone = '', message = '', website = '' } = request.body || {};

  // Honeypot field: bots often fill this hidden input.
  if (website) return response.status(200).json({ ok: true });

  const cleanEmail = String(email).trim().slice(0, 254);
  const cleanPhone = String(phone).trim().slice(0, 40);
  const cleanMessage = String(message).trim().slice(0, 5000);

  if (!EMAIL_PATTERN.test(cleanEmail) || !cleanPhone) {
    return response.status(400).json({ error: 'A valid email address and phone number are required.' });
  }

  const smtpUser = process.env.GOOGLE_SMTP_USER;
  const smtpPassword = process.env.GOOGLE_SMTP_APP_PASSWORD;
  const recipient = process.env.CONTACT_EMAIL || smtpUser;

  if (!smtpUser || !smtpPassword || !recipient) {
    return response.status(503).json({ error: 'Email delivery is not configured.' });
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: smtpUser, pass: smtpPassword }
  });

  try {
    await transporter.sendMail({
      from: `Compass Media Website <${smtpUser}>`,
      to: recipient,
      replyTo: cleanEmail,
      subject: 'New project enquiry from Compass Media website',
      text: [
        `Email: ${cleanEmail}`,
        `Phone: ${cleanPhone}`,
        '',
        'Message:',
        cleanMessage || '(No message provided)'
      ].join('\n')
    });

    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error('Contact form email failed:', error.message);
    return response.status(500).json({ error: 'The enquiry could not be sent.' });
  }
};
