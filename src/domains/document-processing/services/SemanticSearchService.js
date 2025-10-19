const EmbeddingService = require('./EmbeddingService');

/**
 * Service for semantic search and retrieval using embeddings
 */
class SemanticSearchService {
  constructor() {
    this.embeddingService = new EmbeddingService();
  }

  /**
   * Finds the most relevant chunks based on semantic similarity
   * @param {string} query - The user's question
   * @param {Array} chunksWithEmbeddings - Array of objects with {text, embedding}
   * @param {number} topK - Number of top results to return (default: 3)
   * @returns {Promise<Array>} - Array of most relevant chunks with similarity scores
   */
  async findRelevantChunks(query, chunksWithEmbeddings, topK = 3) {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);

      // Calculate similarities
      const similarities = chunksWithEmbeddings.map(chunk => ({
        text: chunk.text,
        similarity: this.embeddingService.cosineSimilarity(queryEmbedding, chunk.embedding)
      }));

      // Sort by similarity (highest first) and return top K
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);

    } catch (error) {
      throw new Error(`Semantic search error: ${error.message}`);
    }
  }

  /**
   * Processes chunks and generates embeddings for all of them
   * @param {string[]} chunks - Array of text chunks
   * @returns {Promise<Array>} - Array of objects with {text, embedding}
   */
  async processChunksWithEmbeddings(chunks) {
    try {
      const chunksWithEmbeddings = [];

      for (const chunk of chunks) {
        const embedding = await this.embeddingService.generateEmbedding(chunk);
        chunksWithEmbeddings.push({
          text: chunk,
          embedding: embedding
        });
      }

      return chunksWithEmbeddings;
    } catch (error) {
      throw new Error(`Chunk processing error: ${error.message}`);
    }
  }
}

module.exports = SemanticSearchService;
