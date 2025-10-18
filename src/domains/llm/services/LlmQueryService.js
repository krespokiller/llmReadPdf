const axios = require('axios');

/**
 * Service for querying Large Language Models
 */
class LlmQueryService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseUrl = 'https://openrouter.ai/api/v1';
  }

  /**
   * Queries the LLM with a user query and context text
   * @param {string} query - The user's question
   * @param {string} context - The context text from the document chunk
   * @returns {Promise<string>} - The LLM's response
   */
  async queryLLM(query, context) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'meituan/longcat-flash-chat:free',
          messages: [
            {
              role: 'user',
              content: `Context: ${context}\n\nQuestion: ${query}\n\nAnswer based on the context provided.`
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      throw new Error(`LLM API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

module.exports = LlmQueryService;

