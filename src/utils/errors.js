const { logError } = require('../services/airtable');

async function handleError(err, res, context = {}) {
  console.error('[ERROR]', err.message, context);

  // Log to Airtable Error Logs (non-blocking)
  try {
    await logError({
      endpoint: context.endpoint || 'unknown',
      teacherBaseId: context.teacherBaseId || '',
      errorMessage: err.message || 'Unknown error',
      requestBody: JSON.stringify(context.body || {})
    });
  } catch (logErr) {
    console.error('[ERROR LOGGING FAILED]', logErr.message);
  }

  return res.status(500).json({
    success: false,
    message: err.message || 'Something went wrong. We\'ve logged this.'
  });
}

module.exports = { handleError };
