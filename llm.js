const axios = require('axios');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * Queries the LLM with a user query and context text.
 * @param {string} query - The user's question.
 * @param {string} context - The context text from the document chunk.
 * @returns {Promise<string>} - The LLM's response.
 */
async function queryLLM(query, context) {
  try {
    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: 'openai/gpt-oss-20b:free',
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
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    throw new Error(`LLM API error: ${error.response?.data?.error?.message || error.message}`);
  }
}

module.exports = { queryLLM };