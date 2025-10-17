/**
 * Cleans and preprocesses text content by removing extra whitespace and normalizing line breaks.
 * @param {string} text - The raw text content.
 * @returns {string} - The cleaned text.
 */
function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')  // Replace multiple whitespace with single space
    .replace(/\n+/g, ' ')  // Replace newlines with spaces
    .trim();  // Trim leading/trailing whitespace
}

/**
 * Splits text into chunks of approximately 1500 words each.
 * @param {string} text - The cleaned text.
 * @returns {string[]} - Array of text chunks.
 */
function chunkText(text) {
  const words = text.split(/\s+/);
  const chunks = [];
  const chunkSize = 1500; // Approximately 1500 words per chunk

  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    chunks.push(chunk);
  }

  return chunks;
}

module.exports = { cleanText, chunkText };