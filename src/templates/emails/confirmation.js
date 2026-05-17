const baseStyle = require('./baseStyle');

function confirmationEmail({ studentName, workshopTitle, workshopType, startDate, endDate, venue, zoomLink, organizationName, logoUrl }) {
  const start = new Date(startDate).toDateString();
  const end = endDate ? new Date(endDate).toDateString() : null;

  return `<!DOCTYPE html><html><head>${baseStyle}</head><body>
    <div class="wrapper">
      <div class="header">
        ${logoUrl ? `<img src="${logoUrl}" alt="${organizationName}" />` : ''}
        <h1>Registration Confirmed</h1>
      </div>
      <div class="body">
        <p>Dear <strong>${studentName}</strong>,</p>
        <p>You have successfully registered for the upcoming workshop. We look forward to seeing you!</p>
        <div class="highlight">
          <p><strong>Workshop:</strong> ${workshopTitle}</p>
          <p><strong>Type:</strong> ${workshopType}</p>
          <p><strong>Date:</strong> ${start}${end && end !== start ? ` – ${end}` : ''}</p>
          ${workshopType === 'Online' && zoomLink ? `<p><strong>Zoom Link:</strong> <a href="${zoomLink}">${zoomLink}</a></p>` : ''}
          ${workshopType === 'Offline' && venue ? `<p><strong>Venue:</strong> ${venue}</p>` : ''}
          ${workshopType === 'Online' && !zoomLink ? `<p><em>The Zoom link will be shared closer to the workshop date.</em></p>` : ''}
        </div>
        <p>You will receive a reminder 2 days before the workshop. Please save this email for your records.</p>
        <p>Warm regards,<br/><strong>${organizationName}</strong></p>
      </div>
      <div class="footer">Powered by WorkshopFlow</div>
    </div>
  </body></html>`;
}

module.exports = { confirmationEmail };
