const axios = require('axios');

async function sendEmail({ to, toName, subject, html, attachments = [] }) {
  const payload = {
    sender: {
      email: process.env.BREVO_SENDER_EMAIL,
      name: process.env.BREVO_SENDER_NAME
    },
    to: [{ email: to, name: toName }],
    subject,
    htmlContent: html
  };

  if (attachments.length > 0) {
    payload.attachment = attachments.map(att => ({
      name: att.name,
      content: att.content
    }));
  }

  const result = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json'
    }
  });

  return result.data;
}

module.exports = { sendEmail };