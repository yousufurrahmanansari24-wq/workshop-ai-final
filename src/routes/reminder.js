const { reminderEmail } = require('../templates/emails/reminder');

function reminderEmail({ studentName, workshopTitle, workshopType, startDate, venue, zoomLink, zoomPassword, organizationName, logoUrl, isOnehour }) {
  const dateStr = new Date(startDate).toDateString();
  const timing = isOnehour ? 'starting in 1 hour' : 'in 2 days';

  return `<!DOCTYPE html><html><head>${baseStyle}</head><body>
    <div class="wrapper">
      <div class="header">
        ${logoUrl ? `<img src="${logoUrl}" alt="${organizationName}" />` : ''}
        <h1>Workshop Reminder</h1>
      </div>
      <div class="body">
        <p>Dear <strong>${studentName}</strong>,</p>
        <p>This is a reminder that your workshop is <strong>${timing}</strong>!</p>
        <div class="highlight">
          <p><strong>Workshop:</strong> ${workshopTitle}</p>
          <p><strong>Date:</strong> ${dateStr}</p>
          ${workshopType === 'Online' && zoomLink ? `
            <p><strong>Zoom Link:</strong> <a href="${zoomLink}">${zoomLink}</a></p>
            ${zoomPassword ? `<p><strong>Password:</strong> ${zoomPassword}</p>` : ''}
          ` : ''}
          ${workshopType === 'Offline' && venue ? `<p><strong>Venue:</strong> ${venue}</p>` : ''}
        </div>
        <p>Please be on time. We look forward to your participation.</p>
        <p>Warm regards,<br/><strong>${organizationName}</strong></p>
      </div>
      <div class="footer">Powered by WorkshopFlow</div>
    </div>
  </body></html>`;
}

module.exports = { reminderEmail };
