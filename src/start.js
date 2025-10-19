require('dotenv').config();
const express = require('express');
const documentRoutes = require('./domains/ui/routes/documentRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public')); // Serve static files from public directory

// Register routes
app.use('/', documentRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Make sure your Docker containers are running:');
  console.log('- ai/embeddinggemma:latest on port 12434');
  console.log('- ai/deepseek-r1-distill-llama:latest on port 12435');
});

module.exports = app;