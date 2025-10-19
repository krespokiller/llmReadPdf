const axios = require('axios');

/**
 * Service for generating embeddings using local Docker model
 */
class EmbeddingService {
  constructor() {
    this.baseUrl = 'http://localhost:12434';
    this.model = 'ai/embeddinggemma:latest';
  }

  /**
   * Generates embeddings for a given text
   * @param {string} text - The text to embed
   * @returns {Promise<number[]>} - The embedding vector
   */
  async generateEmbedding(text) {
    try {
      console.log('EmbeddingService: Starting embedding generation for text length:', text.length);
      console.log('EmbeddingService: Base URL:', this.baseUrl);
      console.log('EmbeddingService: Model:', this.model);
      const response = await axios.post(
        `${this.baseUrl}/engines/llama.cpp/v1/embeddings`,
        {
          model: this.model,
          input: text,
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('EmbeddingService: Response status:', response.status);
      console.log('EmbeddingService: Response data structure:', JSON.stringify(response.data, null, 2));
      return response.data.data[0].embedding;
    } catch (error) {
      console.error('EmbeddingService: Error details:', error);
      console.error('EmbeddingService: Error response:', error.response?.data);
      throw new Error(`Embedding generation error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Generates embeddings for multiple texts
   * @param {string[]} texts - Array of texts to embed
   * @returns {Promise<number[][]>} - Array of embedding vectors
   */
  async generateEmbeddings(texts) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/engines/llama.cpp/v1/embeddings`,
        {
          model: this.model,
          input: texts,
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data.map(item => item.embedding);
    } catch (error) {
      throw new Error(`Embeddings generation error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Calculates cosine similarity between two embedding vectors
   * @param {number[]} embedding1 - First embedding vector
   * @param {number[]} embedding2 - Second embedding vector
   * @returns {number} - Cosine similarity score (-1 to 1)
   */
  cosineSimilarity(embedding1, embedding2) {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embedding vectors must have the same length');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  }
}

module.exports = EmbeddingService;
