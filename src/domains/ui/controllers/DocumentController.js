const { pdfReaderService, textCleanerService, chunkerService } = require('../../document-processing');
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

      // Validate API key
      if (!process.env.OPENROUTER_API_KEY) {
        return res.status(500).json({ error: 'OpenRouter API key not configured' });
      }

      // Query LLM for each chunk and combine responses
      const responses = [];
      for (const chunk of chunks) {
        try {
          const response = await llmQueryService.queryLLM(query, chunk);
          responses.push(response);
        } catch (error) {
          console.error('Error querying LLM for chunk:', error);
          responses.push(`Error processing chunk: ${error.message}`);
        }
      }

      // Combine responses (simple concatenation)
      const combinedResponse = responses.join('\n\n');

      // Return the processed data with LLM response
      res.json({
        query: query,
        response: combinedResponse,
        chunksProcessed: chunks.length,
        responses: responses
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
