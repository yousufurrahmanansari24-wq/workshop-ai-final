const express = require('express');
const router = express.Router();

// Certificate generation is handled inside /api/feedback/submit
// This route exists for potential future use (e.g. re-sending a certificate)

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
const { certificateEmail } = require('../templates/emails/certificate');
const { generateCertId, formatDate } = require('../utils/dateHelpers');
const { handleError } = require('../utils/errors');

/**
 * POST /api/certificate/resend
 * Resend certificate to a student who already submitted feedback
 * Body: { baseId, workshopId, email }
 */
router.post('/resend', auth, async (req, res) => {
  const { baseId, workshopId, email } = req.body;

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

    if (!attendee['Feedback Submitted']) {
      return res.status(400).json({ success: false, message: 'Feedback not submitted yet. Certificate cannot be issued.' });
    }

    // Use existing cert ID or generate new one
    const certId = attendee['Certificate ID'] || generateCertId(teacher['Cert Prefix']);

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

    const pdfBase64 = pdf.toString('base64');

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

    return res.json({ success: true, message: 'Certificate resent successfully.', certId });

  } catch (err) {
    return handleError(err, res, { endpoint: '/api/certificate/resend', teacherBaseId: baseId });
  }
});

module.exports = router;
