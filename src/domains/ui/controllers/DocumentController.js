const { pdfReaderService, textCleanerService, chunkerService, semanticSearchService } = require('../../document-processing');
const { llmQueryService } = require('../../llm');

/**
 * Controller for handling document upload and processing requests
 */
class DocumentController {
  /**
   * Handles document upload and processing
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async processDocument(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No document file provided' });
      }

      if (!req.body.query) {
        return res.status(400).json({ error: 'No query provided' });
      }

      const { buffer } = req.file;
      const query = req.body.query;

      // Extract text from PDF
      const rawText = await pdfReaderService.readPdf(buffer);

      // Clean the text
      const cleanedText = textCleanerService.cleanText(rawText);

      // Chunk the text
      const chunks = chunkerService.chunkText(cleanedText);

      // Generate embeddings for all chunks
      const chunksWithEmbeddings = await semanticSearchService.processChunksWithEmbeddings(chunks);

      // Find the most relevant chunks for the query using semantic search
      const relevantChunks = await semanticSearchService.findRelevantChunks(query, chunksWithEmbeddings, 3);

      // Combine the most relevant chunks into context
      const context = relevantChunks.map(chunk => chunk.text).join('\n\n');

      // Query LLM with the most relevant context
      let response;
      try {
        response = await llmQueryService.queryLLM(query, context);
      } catch (error) {
        console.error('Error querying LLM:', error);
        response = `Error processing query: ${error.message}`;
      }

      // Return the processed data with LLM response
      res.json({
        query: query,
        response: response,
        chunksProcessed: chunks.length,
        relevantChunksFound: relevantChunks.length,
        similarityScores: relevantChunks.map(chunk => ({
          similarity: chunk.similarity.toFixed(4),
          preview: chunk.text.substring(0, 100) + '...'
        }))
      });

    } catch (error) {
      console.error('Error processing upload:', error);
      res.status(500).json({ error: 'Failed to process document: ' + error.message });
    }
  }

  /**
   * Serves the main UI page
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  serveUI(req, res) {
    const fs = require('fs');
    const path = require('path');
    
    try {
      const htmlPath = path.join(__dirname, '..', 'views', 'index.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      res.send(htmlContent);
    } catch (error) {
      console.error('Error loading UI:', error);
      res.status(500).send('Error loading UI: ' + error.message);
    }
  }

  /**
   * Health check endpoint
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  healthCheck(req, res) {
    res.json({ status: 'OK', message: 'Server is running' });
  }
}

module.exports = DocumentController;
