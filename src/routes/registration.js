const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getTeacherByBaseId,
  getWorkshop,
  checkDuplicateAttendee,
  createAttendee,
  logEmail
} = require('../services/airtable');
const { sendEmail } = require('../services/brevo');
const { confirmationEmail } = require('../templates/emails/confirmation');
const { handleError } = require('../utils/errors');

/**
 * POST /api/register
 * Called by React form when student submits
 * Body: { baseId, workshopId, name, email, phone, rollNo, course, yearOfStudy }
 */
router.post('/', auth, async (req, res) => {
  const { baseId, workshopId, name, email, phone, rollNo, course, yearOfStudy } = req.body;

  if (!baseId || !workshopId || !name || !email) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  try {
    // 1. Get teacher credentials from Control Panel
    const teacher = await getTeacherByBaseId(baseId);

    // 2. Get workshop details from teacher's base
    const workshop = await getWorkshop(teacher['Airtable Token'], baseId, workshopId);

    if (workshop['Status'] !== 'Active') {
      return res.status(400).json({ success: false, message: 'This workshop is no longer accepting registrations.' });
    }

    // 3. Check for duplicate registration
    const isDuplicate = await checkDuplicateAttendee(teacher['Airtable Token'], baseId, workshopId, email);
    if (isDuplicate) {
      return res.status(409).json({ success: false, message: 'You are already registered for this workshop.' });
    }

    // 4. Create attendee record
    const attendee = await createAttendee(teacher['Airtable Token'], baseId, {
      workshopId,
      name,
      email,
      phone,
      rollNo,
      course,
      yearOfStudy
    });

    // 5. Send confirmation email
    const html = confirmationEmail({
      studentName: name,
      workshopTitle: workshop['Title'],
      workshopType: workshop['Type'],
      startDate: workshop['Start Date'],
      endDate: workshop['End Date'],
      venue: workshop['Venue'],
      zoomLink: workshop['Zoom Link'],
      organizationName: teacher['Organization'],
      logoUrl: teacher['Logo URL']
    });

    await sendEmail({
      to: email,
      toName: name,
      subject: `Registration Confirmed — ${workshop['Title']}`,
      html
    });

    // 6. Log the email
    await logEmail({
      teacherRecordId: teacher.id,
      studentEmail: email,
      studentName: name,
      workshopName: workshop['Title'],
      emailType: 'Confirmation',
      status: 'Sent',
      attendeeRecordId: attendee.id,
      workshopRecordId: workshopId
    });

    return res.json({
      success: true,
      message: 'Registration confirmed! Check your email.',
      attendeeId: attendee.id
    });

  } catch (err) {
    return handleError(err, res, { endpoint: '/api/register', teacherBaseId: baseId, body: req.body });
  }
});

module.exports = router;
