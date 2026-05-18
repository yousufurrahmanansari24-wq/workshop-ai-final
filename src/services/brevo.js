const Brevo = require('@getbrevo/brevo');

const client = Brevo.ApiClient.instance;
client.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

const apiInstance = new Brevo.TransactionalEmailsApi();

/**
 * Send a transactional email via Brevo
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.toName - Recipient name
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @param {Array} options.attachments - Optional attachments [{name, content (base64)}]
 */
async function sendEmail({ to, toName, subject, html, attachments = [] }) {
  const email = new Brevo.SendSmtpEmail();

  email.sender = {
    email: process.env.BREVO_SENDER_EMAIL,
    name: process.env.BREVO_SENDER_NAME
  };

  email.to = [{ email: to, name: toName }];
  email.subject = subject;
  email.htmlContent = html;

  if (attachments.length > 0) {
    email.attachment = attachments.map(att => ({
      name: att.name,
      content: att.content // base64 encoded
    }));
  }

  const result = await apiInstance.sendTransacEmail(email);
  return result;
}

module.exports = { sendEmail };
