const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getPendingJobs,
  updateJobStatus,
  getTeacherById,
  getWorkshop,
  getWorkshopAttendees,
  updateAttendee,
  logEmail
} = require('../services/airtable');
const { sendEmail } = require('../services/brevo');
const { reminderEmail } = require('../templates/emails/reminder');
const { feedbackEmail } = require('../templates/emails/feedback');
const { handleError } = require('../utils/errors');

/**
 * POST /api/reminder/process
 * Called by n8n every 15 minutes
 * Checks Scheduled Jobs table and fires any due reminders
 */
router.post('/process', auth, async (req, res) => {
  try {
    const jobs = await getPendingJobs();

    if (!jobs.length) {
      return res.json({ success: true, message: 'No pending jobs.', processed: 0 });
    }

    let processed = 0;
    let skipped = 0;
    let failed = 0;

    for (const job of jobs) {
      try {
        const teacherRecordId = job['Teacher']?.[0];
        const teacher = await getTeacherById(teacherRecordId);
        const baseId = teacher['Airtable Base ID'];
        const token = teacher['Airtable Token'];

        const workshop = await getWorkshop(token, baseId, job['Workshop Record ID']);

        // Handle each job type
        if (job['Job Type'] === 'Reminder-2Day' || job['Job Type'] === 'Reminder-1Hr') {

          // Check Zoom link for online workshops
          if (workshop['Type'] === 'Online' && !workshop['Zoom Link']) {
            // Alert teacher instead of sending broken email to students
            await sendEmail({
              to: teacher['Email'],
              toName: teacher['Name'],
              subject: `⚠️ Zoom link missing for ${workshop['Title']}`,
              html: `
                <div style="font-family: Georgia, serif; max-width: 600px; margin: auto; padding: 32px;">
                  <h2>Zoom link missing!</h2>
                  <p>Your workshop <strong>${workshop['Title']}</strong> is coming up but the Zoom link is not set.</p>
                  <p>Please add it in your Airtable base immediately so students receive the correct reminder.</p>
                  <p style="color: #888; font-size: 13px;">WorkshopFlow</p>
                </div>
              `
            });

            await updateJobStatus(job.id, 'Skipped', 'No Zoom link — teacher alerted');
            skipped++;
            continue;
          }

          // Get all attendees for this workshop
          const fieldToCheck = job['Job Type'] === 'Reminder-2Day' ? 'Reminder 2Day Sent' : 'Reminder 1Hr Sent';
          const allAttendees = await getWorkshopAttendees(token, baseId, job['Workshop Record ID']);

          // Filter those who haven't got this reminder yet
          const pending = allAttendees.filter(a => !a[fieldToCheck]);

          for (const attendee of pending) {
            const html = reminderEmail({
              studentName: attendee['Name'],
              workshopTitle: workshop['Title'],
              workshopType: workshop['Type'],
              startDate: workshop['Start Date'],
              venue: workshop['Venue'],
              zoomLink: workshop['Zoom Link'],
              zoomPassword: workshop['Zoom Password'],
              organizationName: teacher['Organization'],
              logoUrl: teacher['Logo URL'],
              isOnehour: job['Job Type'] === 'Reminder-1Hr'
            });

            await sendEmail({
              to: attendee['Email'],
              toName: attendee['Name'],
              subject: `Reminder: ${workshop['Title']} is ${job['Job Type'] === 'Reminder-1Hr' ? 'starting in 1 hour' : 'in 2 days'}`,
              html
            });

            await updateAttendee(token, baseId, attendee.id, {
              [fieldToCheck]: true
            });

            await logEmail({
              teacherRecordId: teacherRecordId,
              studentEmail: attendee['Email'],
              studentName: attendee['Name'],
              workshopName: workshop['Title'],
              emailType: job['Job Type'],
              status: 'Sent',
              attendeeRecordId: attendee.id,
              workshopRecordId: job['Workshop Record ID']
            });
          }

          await updateJobStatus(job.id, 'Completed');
          processed++;

        } else if (job['Job Type'] === 'Feedback-Request') {

          const allAttendees = await getWorkshopAttendees(token, baseId, job['Workshop Record ID']);
          const pending = allAttendees.filter(a => !a['Feedback Requested']);
          const feedbackLink = `${process.env.FRONTEND_URL}/feedback/${baseId}/${job['Workshop Record ID']}`;

          for (const attendee of pending) {
            const html = feedbackEmail({
              studentName: attendee['Name'],
              workshopTitle: workshop['Title'],
              feedbackLink,
              organizationName: teacher['Organization'],
              logoUrl: teacher['Logo URL']
            });

            await sendEmail({
              to: attendee['Email'],
              toName: attendee['Name'],
              subject: `Share your feedback — ${workshop['Title']}`,
              html
            });

            await updateAttendee(token, baseId, attendee.id, {
              'Feedback Requested': true
            });

            await logEmail({
              teacherRecordId: teacherRecordId,
              studentEmail: attendee['Email'],
              studentName: attendee['Name'],
              workshopName: workshop['Title'],
              emailType: 'Feedback Request',
              status: 'Sent',
              attendeeRecordId: attendee.id,
              workshopRecordId: job['Workshop Record ID']
            });
          }

          await updateJobStatus(job.id, 'Completed');
          processed++;
        }

      } catch (jobErr) {
        console.error(`[JOB FAILED] ${job.id}:`, jobErr.message);
        await updateJobStatus(job.id, 'Failed', jobErr.message);
        failed++;
      }
    }

    return res.json({ success: true, processed, skipped, failed });

  } catch (err) {
    return handleError(err, res, { endpoint: '/api/reminder/process' });
  }
});

module.exports = router;
