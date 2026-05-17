/**
 * Certificate HTML template
 * Mimics the style of the example cert — clean, formal, with logos and signatures
 *
 * @param {Object} data
 * @param {string} data.studentName
 * @param {string} data.workshopTitle
 * @param {string} data.workshopDuration - e.g. "Five Day"
 * @param {string} data.workshopType - "Online" | "Offline"
 * @param {string} data.startDate - formatted e.g. "06th April 2026"
 * @param {string} data.endDate - formatted e.g. "10th April 2026"
 * @param {string} data.organizationName
 * @param {string} data.certId - e.g. "WF-2026-YSF-4X2K9Z"
 * @param {string} data.logoUrl - Cloudinary URL
 * @param {string} data.signatory1Name
 * @param {string} data.signatory1Title
 * @param {string} data.signatory1SignatureUrl
 * @param {string} data.signatory2Name - optional
 * @param {string} data.signatory2Title - optional
 * @param {string} data.signatory2SignatureUrl - optional
 */
function certTemplate(data) {
  const hasSecondSignatory = data.signatory2Name && data.signatory2SignatureUrl;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Certificate - ${data.studentName}</title>
  <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Cinzel:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: 297mm;
      height: 210mm;
      background: #fff;
      font-family: 'EB Garamond', Georgia, serif;
      overflow: hidden;
    }

    .cert-wrapper {
      width: 100%;
      height: 100%;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 10mm 16mm;
    }

    /* Decorative border */
    .cert-wrapper::before {
      content: '';
      position: absolute;
      inset: 6mm;
      border: 2.5px solid #b8860b;
      pointer-events: none;
    }
    .cert-wrapper::after {
      content: '';
      position: absolute;
      inset: 8mm;
      border: 1px solid #b8860b;
      pointer-events: none;
    }

    /* Header logos */
    .logos {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      margin-bottom: 4mm;
    }

    .logos img {
      height: 18mm;
      object-fit: contain;
    }

    .logo-divider {
      width: 1px;
      height: 16mm;
      background: #ccc;
    }

    /* Org name */
    .org-name {
      font-family: 'Cinzel', serif;
      font-size: 15pt;
      font-weight: 700;
      color: #1a1a1a;
      text-align: center;
      letter-spacing: 0.5px;
      margin-bottom: 1mm;
    }

    .org-subtitle {
      font-family: 'Cinzel', serif;
      font-size: 9pt;
      font-weight: 600;
      color: #b8860b;
      text-align: center;
      margin-bottom: 5mm;
    }

    /* Certificate title */
    .cert-title {
      font-family: 'Cinzel', serif;
      font-size: 20pt;
      font-weight: 700;
      color: #1a1a1a;
      text-align: center;
      letter-spacing: 1px;
      margin-bottom: 5mm;
    }

    /* Body text */
    .cert-body {
      text-align: center;
      font-size: 12pt;
      color: #333;
      line-height: 1.7;
      margin-bottom: 6mm;
    }

    .student-name {
      font-size: 18pt;
      font-weight: 700;
      color: #b8860b;
      display: block;
      margin: 1mm 0;
    }

    .workshop-title {
      font-weight: 700;
      color: #1a1a1a;
    }

    /* Signatories */
    .signatories {
      display: flex;
      justify-content: ${hasSecondSignatory ? 'space-between' : 'center'};
      align-items: flex-end;
      width: 100%;
      padding: 0 10mm;
      margin-top: 4mm;
    }

    .signatory {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1mm;
      ${!hasSecondSignatory ? 'min-width: 60mm;' : 'min-width: 55mm;'}
    }

    .signatory img {
      height: 12mm;
      object-fit: contain;
      margin-bottom: 1mm;
    }

    .signatory-name {
      font-size: 10pt;
      font-weight: 700;
      color: #1a1a1a;
      text-align: center;
    }

    .signatory-title {
      font-size: 8.5pt;
      color: #555;
      text-align: center;
    }

    /* Cert ID */
    .cert-id {
      position: absolute;
      bottom: 11mm;
      right: 14mm;
      font-size: 7.5pt;
      color: #888;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="cert-wrapper">

    <!-- Logos -->
    <div class="logos">
      ${data.logoUrl ? `<img src="${data.logoUrl}" alt="Logo" />` : ''}
    </div>

    <!-- Org Name -->
    <div class="org-name">${data.organizationName || 'WorkshopFlow'}</div>
    <div class="org-subtitle">Certificate of Participation</div>

    <!-- Title -->
    <div class="cert-title">CERTIFICATE OF PARTICIPATION</div>

    <!-- Body -->
    <div class="cert-body">
      This is to certify that<br/>
      <span class="student-name">${data.studentName}</span>
      has attended the <span class="workshop-title">${data.workshopDuration} ${data.workshopType} Workshop on ${data.workshopTitle}</span><br/>
      from ${data.startDate} to ${data.endDate}<br/>
      conducted by ${data.organizationName}.
    </div>

    <!-- Signatories -->
    <div class="signatories">
      <div class="signatory">
        ${data.signatory1SignatureUrl ? `<img src="${data.signatory1SignatureUrl}" alt="Signature" />` : '<div style="height:12mm"></div>'}
        <div class="signatory-name">${data.signatory1Name}</div>
        <div class="signatory-title">${data.signatory1Title}</div>
      </div>

      ${hasSecondSignatory ? `
      <div class="signatory">
        ${data.signatory2SignatureUrl ? `<img src="${data.signatory2SignatureUrl}" alt="Signature" />` : '<div style="height:12mm"></div>'}
        <div class="signatory-name">${data.signatory2Name}</div>
        <div class="signatory-title">${data.signatory2Title}</div>
      </div>
      ` : ''}
    </div>

    <!-- Cert ID -->
    <div class="cert-id">${data.certId}</div>

  </div>
</body>
</html>
  `;
}

module.exports = { certTemplate };
