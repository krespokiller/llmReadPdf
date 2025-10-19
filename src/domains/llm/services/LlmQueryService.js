const axios = require('axios');

/**
 * Service for querying Large Language Models running locally in Docker
 */
class LlmQueryService {
  constructor() {
    this.baseUrl = 'http://localhost:12434';
    this.model = 'ai/deepseek-r1-distill-llama:latest';
  }

  /**
   * Queries the local LLM with a user query and context text
   * @param {string} query - The user's question
   * @param {string} context - The context text from the document chunk
   * @returns {Promise<string>} - The LLM's response
   */
  async queryLLM(query, context) {
    try {
      console.log('LlmQueryService: Starting LLM query');
      console.log('LlmQueryService: Base URL:', this.baseUrl);
      console.log('LlmQueryService: Model:', this.model);
      console.log('LlmQueryService: Context length:', context.length);
      console.log('LlmQueryService: Query:', query);

      const messages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: `Context: ${context}\n\nQuestion: ${query}\n\nAnswer based on the context provided.` }
      ];

      const response = await axios.post(
        `${this.baseUrl}/engines/llama.cpp/v1/chat/completions`,
        {
          model: this.model,
          messages: messages,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('LlmQueryService: Response status:', response.status);
      console.log('LlmQueryService: Response data structure:', JSON.stringify(response.data, null, 2));

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('LlmQueryService: Error details:', error);
      console.error('LlmQueryService: Error response:', error.response?.data);
      throw new Error(`Local LLM API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

module.exports = LlmQueryService;

