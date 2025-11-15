import { generateEmbedding, generateChatCompletion } from './aiClient'
import { DocumentChunk } from './pdfProcessor'

export interface EmbeddedChunk extends DocumentChunk {
  embedding: number[]
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0)
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0))
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}

/**
 * Generate embeddings for document chunks
 */
export async function embedDocumentChunks(
  chunks: DocumentChunk[]
): Promise<EmbeddedChunk[]> {
  const embeddedChunks: EmbeddedChunk[] = []

  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk.text)
    embeddedChunks.push({
      ...chunk,
      embedding,
    })
  }

  return embeddedChunks
}

/**
 * Find the most relevant chunks for a query using vector similarity
 */
export async function findRelevantChunks(
  query: string,
  embeddedChunks: EmbeddedChunk[],
  topK: number = 3
): Promise<EmbeddedChunk[]> {
  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query)

  // Calculate similarity scores for all chunks
  const chunksWithScores = embeddedChunks.map((chunk) => ({
    chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }))

  // Sort by score (highest first) and take top K
  chunksWithScores.sort((a, b) => b.score - a.score)

  return chunksWithScores.slice(0, topK).map((item) => item.chunk)
}

/**
 * Generate an answer using RAG (Retrieval-Augmented Generation)
 */
export async function generateRAGAnswer(
  query: string,
  embeddedChunks: EmbeddedChunk[]
): Promise<{
  answer: string
  sources: Array<{ source: string; chunkIndex: number }>
}> {
  // Find relevant chunks
  const relevantChunks = await findRelevantChunks(query, embeddedChunks)

  // Build context from relevant chunks
  const context = relevantChunks
    .map((chunk, i) => `[Source ${i + 1}]: ${chunk.text}`)
    .join('\n\n')

  // Create prompt for LLM
  const messages = [
    {
      role: 'system',
      content:
        'You are a helpful AI assistant that answers questions based on the provided context. ' +
        'Always cite your sources by mentioning [Source X] when using information from the context. ' +
        'If the context does not contain enough information to answer the question, say so.',
    },
    {
      role: 'user',
      content: `Context:\n${context}\n\nQuestion: ${query}\n\nPlease provide a detailed answer based on the context above.`,
    },
  ]

  // Generate answer
  const answer = await generateChatCompletion(messages)

  // Extract sources
  const sources = relevantChunks.map((chunk) => ({
    source: chunk.metadata.source,
    chunkIndex: chunk.metadata.chunkIndex,
  }))

  return {
    answer,
    sources,
  }
}
