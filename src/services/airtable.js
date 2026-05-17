const Airtable = require('airtable');

// Control Panel base (your master base)
const controlPanel = new Airtable({ apiKey: process.env.AIRTABLE_CONTROL_PANEL_TOKEN })
  .base(process.env.AIRTABLE_CONTROL_PANEL_BASE_ID);

// ─────────────────────────────────────────────
// CONTROL PANEL OPERATIONS
// ─────────────────────────────────────────────

/**
 * Get teacher by their Airtable Base ID
 */
async function getTeacherByBaseId(baseId) {
  const records = await controlPanel('Teachers').select({
    filterByFormula: `{Airtable Base ID} = '${baseId}'`,
    maxRecords: 1
  }).firstPage();

  if (!records.length) throw new Error(`No teacher found for base ID: ${baseId}`);
  return { id: records[0].id, ...records[0].fields };
}

/**
 * Get teacher by their Airtable record ID
 */
async function getTeacherById(recordId) {
  const record = await controlPanel('Teachers').find(recordId);
  return { id: record.id, ...record.fields };
}

/**
 * Create a new teacher record in Control Panel
 */
async function createTeacher(data) {
  const record = await controlPanel('Teachers').create({
    'Name': data.name,
    'Email': data.email,
    'Phone': data.phone,
    'Organization': data.organization,
    'Airtable Base ID': data.airtableBaseId,
    'Airtable Token': data.airtableToken,
    'Logo URL': data.logoUrl || '',
    'Signature URL': data.signatureUrl || '',
    'Signatory 1 Name': data.signatory1Name || '',
    'Signatory 1 Title': data.signatory1Title || '',
    'Signatory 2 Name': data.signatory2Name || '',
    'Signatory 2 Title': data.signatory2Title || '',
    'Cert Prefix': data.certPrefix || 'WF',
    'Status': 'Active',
    'Onboarded At': new Date().toISOString()
  });
  return { id: record.id, ...record.fields };
}

/**
 * Update teacher record
 */
async function updateTeacher(recordId, data) {
  const record = await controlPanel('Teachers').update(recordId, data);
  return { id: record.id, ...record.fields };
}

/**
 * Log an email (sent or scheduled)
 */
async function logEmail(data) {
  await controlPanel('Email Logs').create({
    'Teacher': data.teacherRecordId ? [data.teacherRecordId] : [],
    'Student Email': data.studentEmail,
    'Student Name': data.studentName,
    'Workshop Name': data.workshopName,
    'Email Type': data.emailType,
    'Status': data.status || 'Sent',
    'Scheduled For': data.scheduledFor || null,
    'Sent At': data.status === 'Sent' ? new Date().toISOString() : null,
    'Error Message': data.errorMessage || '',
    'Attendee Record ID': data.attendeeRecordId || '',
    'Workshop Record ID': data.workshopRecordId || ''
  });
}

/**
 * Create a scheduled job (for n8n to pick up)
 */
async function createScheduledJob(data) {
  const record = await controlPanel('Scheduled Jobs').create({
    'Teacher': data.teacherRecordId ? [data.teacherRecordId] : [],
    'Workshop Record ID': data.workshopRecordId,
    'Workshop Name': data.workshopName,
    'Workshop Date': data.workshopDate,
    'Job Type': data.jobType,
    'Scheduled For': data.scheduledFor,
    'Status': 'Pending'
  });
  return { id: record.id, ...record.fields };
}

/**
 * Get all pending scheduled jobs (called by n8n)
 */
async function getPendingJobs() {
  const now = new Date().toISOString();
  const records = await controlPanel('Scheduled Jobs').select({
    filterByFormula: `AND({Status} = 'Pending', {Scheduled For} <= '${now}')`,
    sort: [{ field: 'Scheduled For', direction: 'asc' }]
  }).all();
  return records.map(r => ({ id: r.id, ...r.fields }));
}

/**
 * Update a scheduled job's status
 */
async function updateJobStatus(recordId, status, notes = '') {
  await controlPanel('Scheduled Jobs').update(recordId, {
    'Status': status,
    'Processed At': new Date().toISOString(),
    'Notes': notes
  });
}

/**
 * Log an error to Error Logs table
 */
async function logError(data) {
  await controlPanel('Error Logs').create({
    'Timestamp': new Date().toISOString(),
    'Endpoint': data.endpoint,
    'Teacher Base ID': data.teacherBaseId,
    'Error Message': data.errorMessage,
    'Request Body': data.requestBody
  });
}

// ─────────────────────────────────────────────
// TEACHER BASE OPERATIONS (dynamic credentials)
// ─────────────────────────────────────────────

/**
 * Get a dynamic Airtable base instance for a teacher
 */
function getTeacherBase(token, baseId) {
  return new Airtable({ apiKey: token }).base(baseId);
}

/**
 * Get workshop from teacher's base
 */
async function getWorkshop(token, baseId, workshopId) {
  const base = getTeacherBase(token, baseId);
  const record = await base('Workshops').find(workshopId);
  return { id: record.id, ...record.fields };
}

/**
 * Get all workshops from teacher's base
 */
async function getWorkshops(token, baseId) {
  const base = getTeacherBase(token, baseId);
  const records = await base('Workshops').select({
    sort: [{ field: 'Start Date', direction: 'desc' }]
  }).all();
  return records.map(r => ({ id: r.id, ...r.fields }));
}

/**
 * Create a workshop in teacher's base
 */
async function createWorkshop(token, baseId, data) {
  const base = getTeacherBase(token, baseId);
  const record = await base('Workshops').create({
    'Title': data.title,
    'Description': data.description || '',
    'Type': data.type,
    'Duration': data.duration || '',
    'Start Date': data.startDate,
    'End Date': data.endDate || data.startDate,
    'Venue': data.venue || '',
    'Zoom Link': data.zoomLink || '',
    'Zoom Password': data.zoomPassword || '',
    'Max Registrations': data.maxRegistrations || 0,
    'Status': 'Active',
    'Created At': new Date().toISOString()
  });
  return { id: record.id, ...record.fields };
}

/**
 * Update workshop (e.g. add Zoom link later)
 */
async function updateWorkshop(token, baseId, workshopId, data) {
  const base = getTeacherBase(token, baseId);
  const record = await base('Workshops').update(workshopId, data);
  return { id: record.id, ...record.fields };
}

/**
 * Check for duplicate attendee registration
 */
async function checkDuplicateAttendee(token, baseId, workshopId, email) {
  const base = getTeacherBase(token, baseId);
  const records = await base('Attendees').select({
    filterByFormula: `AND({Email} = '${email}', RECORD_ID() != '')`,
    maxRecords: 1
  }).firstPage();

  // Filter by workshop link client-side (Airtable linked field filtering is tricky)
  return records.some(r => {
    const workshops = r.fields['Workshop'] || [];
    return workshops.includes(workshopId);
  });
}

/**
 * Create attendee in teacher's base
 */
async function createAttendee(token, baseId, data) {
  const base = getTeacherBase(token, baseId);
  const record = await base('Attendees').create({
    'Workshop': [data.workshopId],
    'Name': data.name,
    'Email': data.email,
    'Phone': data.phone || '',
    'Roll No': data.rollNo || '',
    'Course': data.course || '',
    'Year of Study': data.yearOfStudy || 'Other',
    'Registration Date': new Date().toISOString(),
    'Confirmation Sent': false,
    'Reminder 2Day Sent': false,
    'Reminder 1Hr Sent': false,
    'Feedback Requested': false,
    'Feedback Submitted': false,
    'Certificate Sent': false
  });
  return { id: record.id, ...record.fields };
}

/**
 * Update attendee record (e.g. mark email sent)
 */
async function updateAttendee(token, baseId, attendeeId, data) {
  const base = getTeacherBase(token, baseId);
  const record = await base('Attendees').update(attendeeId, data);
  return { id: record.id, ...record.fields };
}

/**
 * Get all attendees for a workshop
 */
async function getWorkshopAttendees(token, baseId, workshopId) {
  const base = getTeacherBase(token, baseId);
  const records = await base('Attendees').select({
    filterByFormula: `AND({Feedback Submitted} = TRUE(), {Certificate Sent} = FALSE())`
  }).all();

  return records
    .filter(r => (r.fields['Workshop'] || []).includes(workshopId))
    .map(r => ({ id: r.id, ...r.fields }));
}

/**
 * Get attendee by email and workshop
 */
async function getAttendeeByEmail(token, baseId, workshopId, email) {
  const base = getTeacherBase(token, baseId);
  const records = await base('Attendees').select({
    filterByFormula: `{Email} = '${email}'`,
    maxRecords: 5
  }).firstPage();

  const match = records.find(r => (r.fields['Workshop'] || []).includes(workshopId));
  if (!match) return null;
  return { id: match.id, ...match.fields };
}

module.exports = {
  getTeacherByBaseId,
  getTeacherById,
  createTeacher,
  updateTeacher,
  logEmail,
  createScheduledJob,
  getPendingJobs,
  updateJobStatus,
  logError,
  getTeacherBase,
  getWorkshop,
  getWorkshops,
  createWorkshop,
  updateWorkshop,
  checkDuplicateAttendee,
  createAttendee,
  updateAttendee,
  getWorkshopAttendees,
  getAttendeeByEmail
};
