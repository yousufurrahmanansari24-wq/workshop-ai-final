const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createTeacher, updateTeacher, getTeacherByBaseId } = require('../services/airtable');
const { uploadImage } = require('../services/cloudinary');
const { sendEmail } = require('../services/brevo');
const { handleError } = require('../utils/errors');

/**
 * POST /api/teacher/onboard
 * Onboard a new teacher — store credentials, upload assets, provision base
 * Body: {
 *   name, email, phone, organization,
 *   airtableBaseId, airtableToken,
 *   certPrefix,
 *   signatory1Name, signatory1Title,
 *   signatory2Name (optional), signatory2Title (optional),
 *   logoBase64, signatory1SignatureBase64, signatory2SignatureBase64 (optional)
 * }
 */
router.post('/onboard', auth, async (req, res) => {
  const {
    name, email, phone, organization,
    airtableBaseId, airtableToken,
    certPrefix,
    signatory1Name, signatory1Title,
    signatory2Name, signatory2Title,
    logoBase64,
    signatory1SignatureBase64,
    signatory2SignatureBase64
  } = req.body;

  if (!name || !email || !airtableBaseId || !airtableToken) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  try {
    // Upload images to Cloudinary
    const folder = `workshopflow/${airtableBaseId}`;
    let logoUrl = '', sig1Url = '', sig2Url = '';

    if (logoBase64) {
      logoUrl = await uploadImage(logoBase64, `${folder}/logo`, 'logo');
    }
    if (signatory1SignatureBase64) {
      sig1Url = await uploadImage(signatory1SignatureBase64, `${folder}/signatures`, 'sig1');
    }
    if (signatory2SignatureBase64) {
      sig2Url = await uploadImage(signatory2SignatureBase64, `${folder}/signatures`, 'sig2');
    }

    // Create teacher in Control Panel
    const teacher = await createTeacher({
      name, email, phone, organization,
      airtableBaseId, airtableToken,
      certPrefix: certPrefix || name.slice(0, 3).toUpperCase(),
      logoUrl,
      signatory1Name, signatory1Title,
      signatory1SignatureUrl: sig1Url,
      signatory2Name, signatory2Title,
      signatory2SignatureUrl: sig2Url
    });

    // Send teacher their registration link template email
    await sendEmail({
      to: email,
      toName: name,
      subject: 'Welcome to WorkshopFlow — You\'re all set!',
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: auto; padding: 32px;">
          <h2>Welcome, ${name}!</h2>
          <p>Your WorkshopFlow account is ready.</p>
          <p>Create your first workshop in your Airtable base, and your registration link will be auto-generated and sent to you.</p>
          <p style="color: #888; font-size: 13px; margin-top: 32px;">WorkshopFlow Team</p>
        </div>
      `
    });

    return res.json({ success: true, message: 'Teacher onboarded successfully.', teacherId: teacher.id });

  } catch (err) {
    return handleError(err, res, { endpoint: '/api/teacher/onboard', body: req.body });
  }
});

/**
 * PATCH /api/teacher/update
 * Update teacher assets (logo, signatures, etc.)
 */
router.patch('/update', auth, async (req, res) => {
  const { baseId, ...updates } = req.body;

  if (!baseId) return res.status(400).json({ success: false, message: 'baseId is required.' });

  try {
    const teacher = await getTeacherByBaseId(baseId);

    const folder = `workshopflow/${baseId}`;
    if (updates.logoBase64) {
      updates['Logo URL'] = await uploadImage(updates.logoBase64, `${folder}/logo`, 'logo');
      delete updates.logoBase64;
    }
    if (updates.signatory1SignatureBase64) {
      updates['Signature URL'] = await uploadImage(updates.signatory1SignatureBase64, `${folder}/signatures`, 'sig1');
      delete updates.signatory1SignatureBase64;
    }

    await updateTeacher(teacher.id, updates);

    return res.json({ success: true, message: 'Teacher updated.' });
  } catch (err) {
    return handleError(err, res, { endpoint: '/api/teacher/update', teacherBaseId: baseId });
  }
});

module.exports = router;
