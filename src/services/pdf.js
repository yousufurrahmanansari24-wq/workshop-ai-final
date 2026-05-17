const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const { certTemplate } = require('../templates/cert/template');

/**
 * Generate a PDF certificate
 * @param {Object} data - Certificate data
 * @returns {Buffer} PDF buffer
 */
async function generateCertificate(data) {
  const html = certTemplate(data);

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdf = await page.pdf({
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }
  });

  await browser.close();
  return pdf;
}

module.exports = { generateCertificate };
