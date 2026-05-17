const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getTeacherByBaseId,
  createWorkshop,
  updateWorkshop,
  getWorkshops,
  createScheduledJob
} = require('../services/airtable');
const { sendEmail } = require('../services/brevo');
const { handleError } = require('../utils/errors');

/**
 * POST /api/workshop/create
 * Teacher creates a workshop — we store it, generate registration link, email teacher
 * Body: { baseId, title, description, type, duration, startDate, endDate, venue, maxRegistrations }
 */
router.post('/create', auth, async (req, res) => {
  const { baseId, title, description, type, duration, startDate, endDate, venue, maxRegistrations } = req.body;

  if (!baseId || !title || !type || !startDate) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  try {
    const teacher = await getTeacherByBaseId(baseId);

    // Create workshop in teacher's base
    const workshop = await createWorkshop(teacher['Airtable Token'], baseId, {
      title, description, type, duration,
      startDate, endDate: endDate || startDate,
      venue, maxRegistrations: maxRegistrations || 0
    });

    // Generate registration link — points to the React form
    const registrationLink = `${process.env.FRONTEND_URL}/register/${baseId}/${workshop.id}`;

    // Store the link back on the workshop record
    await updateWorkshop(teacher['Airtable Token'], baseId, workshop.id, {
      'Registration Link': registrationLink
    });

    // Schedule reminder jobs
    const workshopStart = new Date(startDate);

    // 2 days before
    const twoDaysBefore = new Date(workshopStart);
    twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);

    // 1 hour before
    const oneHourBefore = new Date(workshopStart);
    oneHourBefore.setHours(oneHourBefore.getHours() - 1);

    // 1 day after (feedback request)
    const oneDayAfter = new Date(workshopStart);
    oneDayAfter.setDate(oneDayAfter.getDate() + 1);

    await Promise.all([
      createScheduledJob({
        teacherRecordId: teacher.id,
        workshopRecordId: workshop.id,
        workshopName: title,
        workshopDate: startDate,
        jobType: 'Reminder-2Day',
        scheduledFor: twoDaysBefore.toISOString()
      }),
      createScheduledJob({
        teacherRecordId: teacher.id,
        workshopRecordId: workshop.id,
        workshopName: title,
        workshopDate: startDate,
        jobType: 'Reminder-1Hr',
        scheduledFor: oneHourBefore.toISOString()
      }),
      createScheduledJob({
        teacherRecordId: teacher.id,
        workshopRecordId: workshop.id,
        workshopName: title,
        workshopDate: startDate,
        jobType: 'Feedback-Request',
        scheduledFor: oneDayAfter.toISOString()
      })
    ]);

    // Email teacher their shareable link
    await sendEmail({
      to: teacher['Email'],
      toName: teacher['Name'],
      subject: `Your workshop link is ready — ${title}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: auto; padding: 32px;">
          <h2>Your workshop is live!</h2>
          <p>Share this link with your students to register for <strong>${title}</strong>:</p>
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0; word-break: break-all;">
            <a href="${registrationLink}" style="color: #b8860b;">${registrationLink}</a>
          </div>
          <p><strong>Workshop Details:</strong></p>
          <ul>
            <li>Type: ${type}</li>
            <li>Start: ${new Date(startDate).toDateString()}</li>
            ${endDate ? `<li>End: ${new Date(endDate).toDateString()}</li>` : ''}
            ${venue ? `<li>Venue: ${venue}</li>` : ''}
          </ul>
          ${type === 'Online' ? `<p style="color: #888;">Don't forget to add your Zoom link in Airtable before the workshop!</p>` : ''}
          <p style="color: #888; font-size: 13px; margin-top: 32px;">WorkshopFlow Team</p>
        </div>
      `
    });

    return res.json({
      success: true,
      message: 'Workshop created and link sent to teacher.',
      workshopId: workshop.id,
      registrationLink
    });

  } catch (err) {
    return handleError(err, res, { endpoint: '/api/workshop/create', teacherBaseId: baseId, body: req.body });
  }
});

/**
 * GET /api/workshop/list?baseId=xxx
 * Get all workshops for a teacher
 */
router.get('/list', auth, async (req, res) => {
  const { baseId } = req.query;
  if (!baseId) return res.status(400).json({ success: false, message: 'baseId is required.' });

  try {
    const teacher = await getTeacherByBaseId(baseId);
    const workshops = await getWorkshops(teacher['Airtable Token'], baseId);
    return res.json({ success: true, workshops });
  } catch (err) {
    return handleError(err, res, { endpoint: '/api/workshop/list', teacherBaseId: baseId });
  }
});

/**
 * PATCH /api/workshop/update
 * Update a workshop (e.g. add Zoom link)
 * Body: { baseId, workshopId, ...fields }
 */
router.patch('/update', auth, async (req, res) => {
  const { baseId, workshopId, ...fields } = req.body;
  if (!baseId || !workshopId) return res.status(400).json({ success: false, message: 'baseId and workshopId required.' });

  try {
    const teacher = await getTeacherByBaseId(baseId);
    const updated = await updateWorkshop(teacher['Airtable Token'], baseId, workshopId, fields);
    return res.json({ success: true, workshop: updated });
  } catch (err) {
    return handleError(err, res, { endpoint: '/api/workshop/update', teacherBaseId: baseId });
  }
});

module.exports = router;
