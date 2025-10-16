const fs = require('fs');
const pdfParse = require('pdf-parse');

async function readPdf(filePath) {
  try {
    const dataBuffer = await fs.promises.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    }
    throw new Error(`Error parsing PDF: ${error.message}`);
  }
}

module.exports = { readPdf };