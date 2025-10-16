/**
 * Retrieval and Querying module for RAG system.
 *
 * This module handles user queries by generating query embeddings, performing similarity search,
 * retrieving relevant chunks, and generating answers using the LLM.
 */

const { generateSingleEmbedding, EMBEDDING_DIMENSIONS } = require('./embeddings');
const { cleanText } = require('./chunker');

/**
 * Preprocesses user query by cleaning and normalizing text.
 * @param {string} query - The raw user query.
 * @returns {string} - The cleaned and normalized query.
 */
function preprocessQuery(query) {
  return cleanText(query).toLowerCase();
}

/**
 * Calculates cosine similarity between two vectors.
 * @param {number[]} vecA - First vector.
 * @param {number[]} vecB - Second vector.
 * @returns {number} - Cosine similarity score between 0 and 1.
 */
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same dimensions');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0; // Avoid division by zero
  }

  return dotProduct / (normA * normB);
}

/**
 * Performs similarity search between query embedding and chunk embeddings.
 * @param {number[]} queryEmbedding - Embedding vector for the query.
 * @param {object[]} embeddingStore - Array of embedding objects with chunk data.
 * @param {number} topK - Number of top similar chunks to retrieve (default: 3).
 * @returns {object[]} - Array of top-k chunks with similarity scores, sorted by relevance.
 */
function performSimilaritySearch(queryEmbedding, embeddingStore, topK = 3) {
  const similarities = embeddingStore.map((chunk, index) => ({
    index,
    chunk,
    similarity: cosineSimilarity(queryEmbedding, chunk.embedding)
  }));

  // Sort by similarity in descending order
  similarities.sort((a, b) => b.similarity - a.similarity);

  // Return top-k results
  return similarities.slice(0, topK);
}

/**
 * Combines retrieved chunks into a formatted context string.
 * @param {object[]} retrievedChunks - Array of retrieved chunks with similarity scores.
 * @returns {string} - Formatted context string for LLM.
 */
function combineChunksIntoContext(retrievedChunks) {
  if (retrievedChunks.length === 0) {
    return 'No relevant context found.';
  }

  const contextParts = retrievedChunks.map((item, idx) => {
    const chunk = item.chunk;
    return `[Source ${idx + 1}] (Similarity: ${item.similarity.toFixed(4)})\n${chunk.text}\n`;
  });

  return contextParts.join('\n');
}

/**
 * Formats the context and query for the LLM API call.
 * @param {string} context - Combined context from retrieved chunks.
 * @param {string} query - The original user query.
 * @returns {string} - Formatted prompt for the LLM.
 */
function formatPromptForLLM(context, query) {
  return `You are a helpful assistant that answers questions based on the provided context from a PDF document.

Context:
${context}

Question: ${query}

Instructions:
- Answer the question based only on the provided context.
- If the context doesn't contain enough information to answer the question, say so.
- Be concise but comprehensive.
- Include references to the sources when relevant (e.g., [Source 1]).
- If multiple sources support your answer, mention them.

Answer:`;
}

/**
 * Sends the retrieval-augmented query to the LLM and parses the response.
 * @param {string} prompt - The formatted prompt for the LLM.
 * @param {string} apiKey - OpenRouter API key.
 * @param {object[]} retrievedChunks - Array of retrieved chunks for source attribution.
 * @returns {Promise<object>} - Promise resolving to the LLM response with source references.
 */
async function queryLLM(prompt, apiKey, retrievedChunks) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b:free', // Using the same model as in index.js
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.1, // Low temperature for factual responses
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`LLM API request failed: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid LLM response format: missing message data');
    }

    const answer = data.choices[0].message.content;

    // Parse source references from the answer
    const sources = retrievedChunks.map((item, idx) => ({
      id: item.chunk.id,
      similarity: item.similarity,
      textPreview: item.chunk.textPreview,
      reference: `[Source ${idx + 1}]`
    }));

    return {
      answer,
      sources,
      usage: data.usage || {},
      model: data.model || 'unknown'
    };

  } catch (error) {
    console.error('Error querying LLM:', error.message);
    throw error;
  }
}

/**
 * Main RAG query function that processes user queries end-to-end.
 * @param {string} query - The user's question.
 * @param {object[]} embeddingStore - The pre-computed embedding store from chunks.
 * @param {string} apiKey - OpenRouter API key.
 * @param {object} options - Configuration options.
 * @param {number} options.topK - Number of top chunks to retrieve (default: 3).
 * @returns {Promise<object>} - Promise resolving to the complete RAG response.
 */
async function ragQuery(query, embeddingStore, apiKey, options = {}) {
  const { topK = 3 } = options;

  try {
    console.log(`Processing RAG query: "${query}"`);

    // 1. Preprocess query
    const cleanedQuery = preprocessQuery(query);
    console.log(`Preprocessed query: "${cleanedQuery}"`);

    // 2. Generate query embedding
    console.log('Generating query embedding...');
    const queryEmbedding = await generateSingleEmbedding(cleanedQuery);
    console.log('Query embedding generated successfully');

    // 3. Perform similarity search
    console.log(`Performing similarity search (top-${topK})...`);
    const retrievedChunks = performSimilaritySearch(queryEmbedding, embeddingStore, topK);

    // Log retrieval metrics
    console.log(`Retrieved ${retrievedChunks.length} chunks:`);
    retrievedChunks.forEach((item, idx) => {
      console.log(`  ${idx + 1}. Similarity: ${item.similarity.toFixed(4)}, Chunk ID: ${item.chunk.id}, Preview: "${item.chunk.textPreview}"`);
    });

    // 4. Combine chunks into context
    const context = combineChunksIntoContext(retrievedChunks);
    console.log(`Context length: ${context.length} characters`);

    // 5. Format prompt for LLM
    const prompt = formatPromptForLLM(context, query);

    // 6. Query LLM
    console.log('Querying LLM...');
    const llmResponse = await queryLLM(prompt, apiKey, retrievedChunks);

    // 7. Return complete response
    console.log('RAG query completed successfully');
    return {
      query: query,
      preprocessedQuery: cleanedQuery,
      retrievedChunks: retrievedChunks.map(item => ({
        id: item.chunk.id,
        similarity: item.similarity,
        textPreview: item.chunk.textPreview
      })),
      contextLength: context.length,
      answer: llmResponse.answer,
      sources: llmResponse.sources,
      usage: llmResponse.usage,
      model: llmResponse.model,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error in RAG query:', error.message);
    throw error;
  }
}

module.exports = {
  ragQuery,
  preprocessQuery,
  cosineSimilarity,
  performSimilaritySearch,
  combineChunksIntoContext,
  formatPromptForLLM,
  queryLLM
};