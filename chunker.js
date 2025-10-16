const { readPdf } = require('./pdfReader');

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
 * Splits text into an array of words.
 * @param {string} text - The cleaned text.
 * @returns {string[]} - Array of words.
 */
function splitIntoWords(text) {
  return text.split(/\s+/);
}

/**
 * Creates overlapping chunks from an array of words.
 * @param {string[]} words - Array of words.
 * @param {number} chunkSize - Number of words per chunk.
 * @param {number} overlap - Number of overlapping words between chunks.
 * @returns {string[]} - Array of chunk strings.
 */
function createOverlappingChunks(words, chunkSize, overlap) {
  const chunks = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    const chunk = words.slice(start, end).join(' ');
    chunks.push(chunk);
    start += chunkSize - overlap;

    if (start >= words.length) break;
  }

  return chunks;
}

/**
 * Validates that chunks contain meaningful content (more than 5 words).
 * @param {string[]} chunks - Array of chunk strings.
 * @returns {string[]} - Filtered array of valid chunks.
 */
function validateChunks(chunks) {
  return chunks.filter(chunk => {
    const wordCount = chunk.split(/\s+/).length;
    return wordCount > 5;  // Consider chunks with more than 5 words as meaningful
  });
}

/**
 * Chunks PDF content into overlapping text chunks.
 * @param {string} filePath - Path to the PDF file.
 * @param {object} options - Configuration options.
 * @param {number} options.chunkSize - Number of words per chunk (default: 500).
 * @param {number} options.overlap - Number of overlapping words (default: 50).
 * @returns {Promise<string[]>} - Promise resolving to array of text chunks.
 */
async function chunkPdfContent(filePath, options = {}) {
  const { chunkSize = 500, overlap = 50 } = options;

  try {
    // 1. Read PDF content
    const rawContent = await readPdf(filePath);

    // 2. Clean and preprocess text
    const cleanedText = cleanText(rawContent);

    // 3. Split into words
    const words = splitIntoWords(cleanedText);

    // 4. Create overlapping chunks
    const rawChunks = createOverlappingChunks(words, chunkSize, overlap);

    // 5. Validate chunks
    const validChunks = validateChunks(rawChunks);

    // 6. Add logging
    console.log(`Created ${validChunks.length} chunks from PDF content. Chunk size: ${chunkSize} words, Overlap: ${overlap} words.`);

    // 7. Return chunks array
    return validChunks;

  } catch (error) {
    console.error('Error chunking PDF content:', error.message);
    throw error;
  }
}

module.exports = { chunkPdfContent, cleanText };