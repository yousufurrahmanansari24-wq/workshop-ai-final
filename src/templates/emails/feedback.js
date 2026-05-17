const baseStyle = require('./baseStyle');

function feedbackEmail({ studentName, workshopTitle, feedbackLink, organizationName, logoUrl }) {
  return `<!DOCTYPE html><html><head>${baseStyle}</head><body>
    <div class="wrapper">
      <div class="header">
        ${logoUrl ? `<img src="${logoUrl}" alt="${organizationName}" />` : ''}
        <h1>Share Your Feedback</h1>
      </div>
      <div class="body">
        <p>Dear <strong>${studentName}</strong>,</p>
        <p>Thank you for attending <strong>${workshopTitle}</strong>. We hope it was valuable for you!</p>
        <p>We would love to hear your thoughts. Please take 2 minutes to fill out our feedback form — your certificate of participation will be generated immediately after.</p>
        <div style="text-align: center;">
          <a href="${feedbackLink}" class="cta">Submit Feedback & Get Certificate</a>
        </div>
        <p style="font-size: 13px; color: #888;">This link is valid for your email only. One submission per participant.</p>
        <p>Warm regards,<br/><strong>${organizationName}</strong></p>
      </div>
      <div class="footer">Powered by WorkshopFlow</div>
    </div>
  </body></html>`;
}

module.exports = { feedbackEmail };
