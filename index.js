/**
 * RAG (Retrieval-Augmented Generation) PDF Summarizer
 *
 * This script implements a complete RAG pipeline:
 * 1. Chunk the PDF content into manageable pieces
 * 2. Generate embeddings for each chunk using OpenAI's embedding model
 * 3. Store chunks with their embeddings for retrieval
 * 4. Use similarity search to find relevant chunks for a query
 * 5. Generate a response using the retrieved context
 */

const { chunkPdfContent } = require('./chunker');
const { generateEmbeddingsForChunks } = require('./embeddings');
const { ragQuery } = require('./retrieval');

async function main() {
  console.log("RAG PDF Summarizer started");

  // Configuration - using the same API key and model as before
  const apiKey = "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";
  const pdfPath = './assets/prueba_tecnica_platzi.pdf';

  try {
    // Step 1: Chunk the PDF content
    // This breaks the PDF into overlapping text chunks for better retrieval
    console.log("Step 1: Reading and chunking PDF file...");
    const chunks = await chunkPdfContent(pdfPath);
    console.log(`✓ PDF chunked into ${chunks.length} chunks`);

    // Step 2: Generate embeddings for each chunk
    // Convert text chunks to vector embeddings using local Hugging Face model
    console.log("Step 2: Generating embeddings for chunks...");
    const embeddingStore = await generateEmbeddingsForChunks(chunks);
    console.log(`✓ Generated embeddings for ${embeddingStore.length} chunks`);

    // Step 3: Perform RAG query
    // Use retrieval-augmented generation to answer the summarization query
    console.log("Step 3: Performing RAG query for summarization...");
    const query = "Extract and summarize the content of this PDF file";
    const ragResponse = await ragQuery(query, embeddingStore, apiKey);
    console.log("✓ RAG query completed successfully");

    // Display results
    console.log("\n" + "=".repeat(50));
    console.log("RAG RESPONSE:");
    console.log("=".repeat(50));
    console.log("Answer:", ragResponse.answer);
    console.log(`Sources used: ${ragResponse.sources.length}`);
    console.log(`Model used: ${ragResponse.model}`);
    console.log("=".repeat(50));

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error:`, error.message);
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
  }
}

main();