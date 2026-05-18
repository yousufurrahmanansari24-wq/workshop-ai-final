const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getTeacherByBaseId,
  getWorkshop,
  getAttendeeByEmail,
  updateAttendee,
  logEmail
} = require('../services/airtable');
const { sendEmail } = require('../services/brevo');
const { generateCertificate } = require('../services/pdf');
const { certTemplate } = require('../templates/cert/template');
const { certificateEmail } = require('../templates/emails/certificate');
const { generateCertId, formatDate } = require('../utils/dateHelpers');
const { handleError } = require('../utils/errors');

/**
 * POST /api/feedback/submit
 * Called when student submits feedback form
 * Body: { baseId, workshopId, email, responses (any feedback data) }
 */
router.post('/submit', auth, async (req, res) => {
  const { baseId, workshopId, email, responses } = req.body;

  if (!baseId || !workshopId || !email) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  try {
    const teacher = await getTeacherByBaseId(baseId);
    const workshop = await getWorkshop(teacher['Airtable Token'], baseId, workshopId);
    const attendee = await getAttendeeByEmail(teacher['Airtable Token'], baseId, workshopId, email);

    if (!attendee) {
      return res.status(404).json({ success: false, message: 'No registration found for this email.' });
    }

    // Prevent duplicate feedback
    if (attendee['Feedback Submitted']) {
      return res.status(409).json({ success: false, message: 'You have already submitted feedback and your certificate is on its way.' });
    }

    // Mark feedback submitted
    await updateAttendee(teacher['Airtable Token'], baseId, attendee.id, {
      'Feedback Submitted': true
    });

    // Generate certificate
    const certId = generateCertId(teacher['Cert Prefix']);

    const pdf = await generateCertificate({
      studentName: attendee['Name'],
      workshopTitle: workshop['Title'],
      workshopDuration: workshop['Duration'] || 'One Day',
      workshopType: workshop['Type'],
      startDate: formatDate(workshop['Start Date']),
      endDate: formatDate(workshop['End Date'] || workshop['Start Date']),
      organizationName: teacher['Organization'],
      certId,
      logoUrl: teacher['Logo URL'],
      signatory1Name: teacher['Signatory 1 Name'],
      signatory1Title: teacher['Signatory 1 Title'],
      signatory1SignatureUrl: teacher['Signature URL'],
      signatory2Name: teacher['Signatory 2 Name'] || '',
      signatory2Title: teacher['Signatory 2 Title'] || '',
      signatory2SignatureUrl: teacher['Signatory 2 Signature URL'] || ''
    });

    // Convert PDF buffer to base64 for email attachment
    const pdfBase64 = pdf.toString('base64');

    // Send certificate email
    const html = certificateEmail({
      studentName: attendee['Name'],
      workshopTitle: workshop['Title'],
      organizationName: teacher['Organization'],
      certId,
      logoUrl: teacher['Logo URL']
    });

    await sendEmail({
      to: attendee['Email'],
      toName: attendee['Name'],
      subject: `Your Certificate — ${workshop['Title']}`,
      html,
      attachments: [{
        name: `Certificate_${attendee['Name'].replace(/\s+/g, '_')}.pdf`,
        content: pdfBase64
      }]
    });

    // Update attendee with cert info
    await updateAttendee(teacher['Airtable Token'], baseId, attendee.id, {
      'Certificate Sent': true,
      'Certificate ID': certId
    });

    await logEmail({
      teacherRecordId: teacher.id,
      studentEmail: attendee['Email'],
      studentName: attendee['Name'],
      workshopName: workshop['Title'],
      emailType: 'Certificate',
      status: 'Sent',
      attendeeRecordId: attendee.id,
      workshopRecordId: workshopId
    });

    return res.json({
      success: true,
      message: 'Feedback received! Your certificate has been sent to your email.',
      certId
    });

  } catch (err) {
    return handleError(err, res, { endpoint: '/api/feedback/submit', teacherBaseId: baseId, body: req.body });
  }
});

module.exports = router;
