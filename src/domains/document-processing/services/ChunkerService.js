/**
 * Service for splitting text into manageable chunks
 */
class ChunkerService {
  /**
   * Splits text into chunks of approximately 1500 words each
   * @param {string} text - The cleaned text
   * @returns {string[]} - Array of text chunks
   */
  chunkText(text) {
    const words = text.split(/\s+/);
    const chunks = [];
    const chunkSize = 1500; // Approximately 1500 words per chunk

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      chunks.push(chunk);
    }

    return chunks;
  }
}

module.exports = ChunkerService;

