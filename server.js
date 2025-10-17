require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { readPdf } = require('./pdfReader');
const { cleanText, chunkText } = require('./chunker');
const { queryLLM } = require('./llm');

const app = express();
const port = process.env.PORT || 3000;

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(express.json());
app.use(express.static('public')); // Serve static files from public directory

// GET / - Serve the UI
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document Reader Tool</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .upload-form { margin-bottom: 20px; }
        input[type="file"] { margin-bottom: 10px; }
        button { padding: 10px 20px; background-color: #007bff; color: white; border: none; cursor: pointer; }
        button:hover { background-color: #0056b3; }
        #results { margin-top: 20px; }
        .chunk { border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <h1>Document Reader Tool</h1>
      <form class="upload-form" id="uploadForm">
        <input type="file" id="document" name="document" accept=".pdf" required>
        <input type="text" id="query" name="query" placeholder="Enter your query" required>
        <button type="submit">Process Document</button>
      </form>
      <div id="results"></div>

      <script>
        document.getElementById('uploadForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const formData = new FormData();
          formData.append('document', document.getElementById('document').files[0]);
          formData.append('query', document.getElementById('query').value);

          const results = document.getElementById('results');
          results.innerHTML = 'Processing...';

          try {
            const response = await fetch('/upload', {
              method: 'POST',
              body: formData
            });
            const data = await response.json();
            if (response.ok) {
              results.innerHTML = '<h2>Answer</h2>' +
                '<p><strong>Your Query:</strong> ' + data.query + '</p>' +
                '<div><strong>Response:</strong><br>' + data.response + '</div>';
            } else {
              results.innerHTML = '<p>Error: ' + data.error + '</p>';
            }
          } catch (error) {
            results.innerHTML = '<p>Error: ' + error.message + '</p>';
          }
        });
      </script>
    </body>
    </html>
  `);
});

// POST /upload - Process document and query
app.post('/upload', upload.single('document'), async (req, res) => {
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
    const rawText = await readPdf(buffer);

    // Clean the text
    const cleanedText = cleanText(rawText);

    // Chunk the text
    const chunks = chunkText(cleanedText);

    // Validate API key
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }

    // Query LLM for each chunk and combine responses
    const responses = [];
    for (const chunk of chunks) {
      try {
        const response = await queryLLM(query, chunk);
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
});

// GET /health - Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;