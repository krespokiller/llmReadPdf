const pdfParse = require('pdf-parse');

/**
 * Service for reading and extracting text from PDF documents
 */
class PdfReaderService {
  /**
   * Extracts text content from a PDF buffer
   * @param {Buffer} buffer - The PDF file buffer
   * @returns {Promise<string>} - The extracted text content
   */
  async readPdf(buffer) {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      throw new Error(`Error parsing PDF: ${error.message}`);
    }
  }
}

module.exports = PdfReaderService;

