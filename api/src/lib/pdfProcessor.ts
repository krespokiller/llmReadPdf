// Import pdf-parse correctly as a CommonJS default export
import PdfParse = require('pdf-parse')

export interface DocumentChunk {
  id: string
  text: string
  metadata: {
    source: string
    page?: number
    chunkIndex: number
  }
}

/**
 * Extract text from PDF buffer
 */
export async function extractTextFromPDF(
  buffer: Buffer,
  filename: string
): Promise<string> {
  try {
    const data = await PdfParse(buffer)
    return data.text
  } catch (error) {
    console.error('Error extracting text from PDF:', error)
    throw new Error(`Failed to extract text from ${filename}`)
  }
}

/**
 * Split text into chunks for embedding
 * @param text - The text to split
 * @param chunkSize - Maximum characters per chunk
 * @param overlap - Number of characters to overlap between chunks
 */
export function splitTextIntoChunks(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200
): string[] {
  const chunks: string[] = []

  // Clean and normalize text
  const cleanedText = text.replace(/\s+/g, ' ').trim()

  let startIndex = 0

  while (startIndex < cleanedText.length) {
    const endIndex = Math.min(startIndex + chunkSize, cleanedText.length)
    const chunk = cleanedText.slice(startIndex, endIndex)

    chunks.push(chunk)

    // Move start index forward, accounting for overlap
    startIndex += chunkSize - overlap
  }

  return chunks
}

/**
 * Process PDF and create document chunks with metadata
 */
export async function processPDF(
  buffer: Buffer,
  filename: string
): Promise<DocumentChunk[]> {
  const text = await extractTextFromPDF(buffer, filename)
  const textChunks = splitTextIntoChunks(text)

  return textChunks.map((chunk, index) => ({
    id: `${filename}-chunk-${index}`,
    text: chunk,
    metadata: {
      source: filename,
      chunkIndex: index,
    },
  }))
}
