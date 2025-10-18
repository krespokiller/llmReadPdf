const PdfReaderService = require('./services/PdfReaderService');
const TextCleanerService = require('./services/TextCleanerService');
const ChunkerService = require('./services/ChunkerService');

// Create service instances
const pdfReaderService = new PdfReaderService();
const textCleanerService = new TextCleanerService();
const chunkerService = new ChunkerService();

module.exports = {
  pdfReaderService,
  textCleanerService,
  chunkerService
};

