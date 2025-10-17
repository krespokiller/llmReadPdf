const pdfParse = require('pdf-parse');

async function readPdf(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    throw new Error(`Error parsing PDF: ${error.message}`);
  }
}

module.exports = { readPdf };