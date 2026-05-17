const baseStyle = require('./baseStyle');

function certificateEmail({ studentName, workshopTitle, organizationName, certId, logoUrl }) {
  return `<!DOCTYPE html><html><head>${baseStyle}</head><body>
    <div class="wrapper">
      <div class="header">
        ${logoUrl ? `<img src="${logoUrl}" alt="${organizationName}" />` : ''}
        <h1>Your Certificate is Here</h1>
      </div>
      <div class="body">
        <p>Dear <strong>${studentName}</strong>,</p>
        <p>Congratulations on completing <strong>${workshopTitle}</strong>!</p>
        <p>Please find your Certificate of Participation attached to this email.</p>
        <div class="highlight">
          <p><strong>Certificate ID:</strong> ${certId}</p>
          <p><em>Keep this ID for your records — it can be used to verify your certificate.</em></p>
        </div>
        <p>Thank you for your participation. We hope to see you again!</p>
        <p>Warm regards,<br/><strong>${organizationName}</strong></p>
      </div>
      <div class="footer">Powered by WorkshopFlow</div>
    </div>
  </body></html>`;
}

module.exports = { certificateEmail };
