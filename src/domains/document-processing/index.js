const PdfReaderService = require('./services/PdfReaderService');
const TextCleanerService = require('./services/TextCleanerService');
const ChunkerService = require('./services/ChunkerService');
const EmbeddingService = require('./services/EmbeddingService');
const SemanticSearchService = require('./services/SemanticSearchService');

// Create service instances
const pdfReaderService = new PdfReaderService();
const textCleanerService = new TextCleanerService();
const chunkerService = new ChunkerService();
const embeddingService = new EmbeddingService();
const semanticSearchService = new SemanticSearchService();

module.exports = {
  pdfReaderService,
  textCleanerService,
  chunkerService,
  embeddingService,
  semanticSearchService
};

