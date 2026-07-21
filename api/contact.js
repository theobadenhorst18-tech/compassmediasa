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

  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.CONTACT_EMAIL || 'theo@compassmediasa.co.za';

  if (!apiKey || !recipient) {
    return response.status(503).json({ error: 'Email delivery is not configured.' });
  }

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Compass Media Website <website@compassmediasa.co.za>',
        to: [recipient],
        reply_to: cleanEmail,
        subject: 'New project enquiry from Compass Media website',
        text: [
          `Email: ${cleanEmail}`,
          `Phone: ${cleanPhone}`,
          '',
          'Message:',
          cleanMessage || '(No message provided)'
        ].join('\n')
      })
    });

    if (!resendResponse.ok) {
      const details = await resendResponse.text();
      throw new Error(`Resend rejected the email (${resendResponse.status}): ${details}`);
    }

    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error('Contact form email failed:', error.message);
    return response.status(500).json({ error: 'The enquiry could not be sent.' });
  }
};
