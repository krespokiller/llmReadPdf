/**
 * Embeddings module for generating vector embeddings from text chunks.
 *
 * This module provides functionality to generate embeddings using Hugging Face Transformers
 * locally. It includes batch processing and comprehensive error handling.
 *
 * Embedding Model: all-MiniLM-L6-v2 (384 dimensions)
 * Provider: Hugging Face Transformers (local)
 */

// Configuration constants
const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
const EMBEDDING_DIMENSIONS = 384;
const MAX_BATCH_SIZE = 32; // Smaller batches for local processing

// Global model cache
let extractor = null;

/**
 * Initializes the Hugging Face model extractor.
 * @returns {Promise<object>} - Promise resolving to the model extractor.
 */
async function initializeModel() {
  if (!extractor) {
    const { pipeline } = await import('@xenova/transformers');
    extractor = await pipeline('feature-extraction', EMBEDDING_MODEL);
    console.log('Hugging Face model initialized successfully');
  }
  return extractor;
}

/**
 * Generates an embedding for a single text chunk using Hugging Face Transformers.
 * @param {string} text - The text chunk to embed.
 * @returns {Promise<number[]>} - Promise resolving to the embedding vector.
 */
async function generateSingleEmbedding(text) {
  try {
    const model = await initializeModel();
    const output = await model(text, { pooling: 'mean', normalize: true });

    // Convert tensor to array
    const embedding = Array.from(output.data);

    // Validate embedding dimensions
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(`Invalid embedding dimensions: expected ${EMBEDDING_DIMENSIONS}, got ${embedding.length}`);
    }

    console.log(`Generated embedding for chunk (${text.length} chars)`);
    return embedding;

  } catch (error) {
    console.error('Error generating embedding:', error.message);
    throw error;
  }
}

/**
 * Generates embeddings for multiple text chunks in batches.
 * @param {string[]} chunks - Array of text chunks to embed.
 * @returns {Promise<number[][]>} - Promise resolving to array of embedding vectors.
 */
async function generateBatchEmbeddings(chunks) {
  const embeddings = [];
  const totalChunks = chunks.length;

  console.log(`Starting batch embedding generation for ${totalChunks} chunks`);

  for (let i = 0; i < chunks.length; i += MAX_BATCH_SIZE) {
    const batch = chunks.slice(i, i + MAX_BATCH_SIZE);
    const batchNumber = Math.floor(i / MAX_BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(chunks.length / MAX_BATCH_SIZE);

    console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} chunks)`);

    try {
      // Process batch sequentially for local model
      const batchEmbeddings = [];
      for (const chunk of batch) {
        const embedding = await generateSingleEmbedding(chunk);
        batchEmbeddings.push(embedding);
      }

      embeddings.push(...batchEmbeddings);
      console.log(`Completed batch ${batchNumber}/${totalBatches}`);

    } catch (error) {
      console.error(`Failed to process batch ${batchNumber}:`, error.message);
      throw error; // Stop processing if a batch fails
    }
  }

  console.log(`Successfully generated ${embeddings.length}/${totalChunks} embeddings`);
  return embeddings;
}

/**
 * Creates a structured embedding store with chunk associations.
 * @param {string[]} chunks - Array of text chunks.
 * @param {number[][]} embeddings - Array of embedding vectors.
 * @returns {object[]} - Array of embedding objects with metadata.
 */
function createEmbeddingStore(chunks, embeddings) {
  if (chunks.length !== embeddings.length) {
    throw new Error(`Chunks and embeddings count mismatch: ${chunks.length} chunks, ${embeddings.length} embeddings`);
  }

  const embeddingStore = chunks.map((chunk, index) => ({
    id: index,
    text: chunk,
    textPreview: chunk.length > 100 ? chunk.substring(0, 100) + '...' : chunk,
    embedding: embeddings[index],
    wordCount: chunk.split(/\s+/).length,
    charCount: chunk.length,
    timestamp: new Date().toISOString(),
  }));

  console.log(`Created embedding store with ${embeddingStore.length} entries`);
  return embeddingStore;
}

/**
 * Validates embedding quality and consistency.
 * @param {number[][]} embeddings - Array of embedding vectors to validate.
 * @returns {boolean} - True if all embeddings are valid.
 */
function validateEmbeddings(embeddings) {
  if (!Array.isArray(embeddings) || embeddings.length === 0) {
    throw new Error('Embeddings array is empty or invalid');
  }

  for (let i = 0; i < embeddings.length; i++) {
    const embedding = embeddings[i];

    if (!Array.isArray(embedding)) {
      throw new Error(`Embedding at index ${i} is not an array`);
    }

    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(`Embedding at index ${i} has invalid dimensions: expected ${EMBEDDING_DIMENSIONS}, got ${embedding.length}`);
    }

    // Check for NaN or infinite values
    for (const value of embedding) {
      if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
        throw new Error(`Embedding at index ${i} contains invalid value: ${value}`);
      }
    }
  }

  console.log(`Validated ${embeddings.length} embeddings - all dimensions and values are valid`);
  return true;
}

/**
 * Main function to generate embeddings for PDF chunks.
 * @param {string[]} chunks - Array of text chunks from PDF.
 * @returns {Promise<object[]>} - Promise resolving to structured embedding store.
 */
async function generateEmbeddingsForChunks(chunks) {
  try {
    console.log('Starting embedding generation process...');
    console.log(`Model: ${EMBEDDING_MODEL}, Dimensions: ${EMBEDDING_DIMENSIONS}`);

    // Generate embeddings in batches
    const embeddings = await generateBatchEmbeddings(chunks);

    // Validate embeddings
    validateEmbeddings(embeddings);

    // Create structured store
    const embeddingStore = createEmbeddingStore(chunks, embeddings);

    console.log('Embedding generation completed successfully');
    console.log(`Total embeddings: ${embeddingStore.length}`);
    console.log(`Processed locally: ${chunks.length} chunks`);

    return embeddingStore;

  } catch (error) {
    console.error('Failed to generate embeddings:', error.message);
    throw error;
  }
}

module.exports = {
  generateEmbeddingsForChunks,
  generateSingleEmbedding,
  generateBatchEmbeddings,
  createEmbeddingStore,
  validateEmbeddings,
  initializeModel,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
};