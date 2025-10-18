/**
 * Service for cleaning and preprocessing text content
 */
class TextCleanerService {
  /**
   * Cleans and preprocesses text content by removing extra whitespace and normalizing line breaks
   * @param {string} text - The raw text content
   * @returns {string} - The cleaned text
   */
  cleanText(text) {
    return text
      .replace(/\s+/g, ' ')  // Replace multiple whitespace with single space
      .replace(/\n+/g, ' ')  // Replace newlines with spaces
      .trim();  // Trim leading/trailing whitespace
  }
}

module.exports = TextCleanerService;

