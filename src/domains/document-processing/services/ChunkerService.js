/**
 * Service for splitting text into manageable chunks
 */
class ChunkerService {
  /**
   * Splits text into chunks of approximately 200 words each to avoid embedding API limits
   * @param {string} text - The cleaned text
   * @returns {string[]} - Array of text chunks
   */
  chunkText(text) {
    const words = text.split(/\s+/);
    const chunks = [];
    const chunkSize = 200; // Further reduced to 200 words per chunk to avoid API limits

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      chunks.push(chunk);
    }

    return chunks;
  }
}

module.exports = ChunkerService;

