import { processPDF } from 'src/lib/pdfProcessor'
import {
  embedDocumentChunks,
  generateRAGAnswer,
  EmbeddedChunk,
} from 'src/lib/ragService'

// In-memory storage for embedded document chunks
let documentStore: EmbeddedChunk[] = []

interface FileUpload {
  buffer: Buffer
  filename: string
  mimetype: string
}

export const chat = async ({ question }: { question: string }) => {
  if (documentStore.length === 0) {
    throw new Error(
      'No documents have been uploaded yet. Please upload a PDF first.'
    )
  }

  const result = await generateRAGAnswer(question, documentStore)
  return result
}

export const uploadPDF = async ({ file }: { file: any }) => {
  try {
    // File is already a promise, await it
    const upload = await file

    // The file object should have arrayBuffer or we need to read it differently
    let buffer: Buffer

    if (upload.arrayBuffer) {
      // Modern File API
      const arrayBuffer = await upload.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    } else if (upload instanceof Buffer) {
      buffer = upload
    } else {
      throw new Error('Unable to read file buffer')
    }

    const filename = upload.name || upload.filename || 'document.pdf'

    // Process PDF and extract chunks
    const documentChunks = await processPDF(buffer, filename)

    // Generate embeddings for chunks
    const embeddedChunks = await embedDocumentChunks(documentChunks)

    // Add to document store
    documentStore.push(...embeddedChunks)

    return {
      success: true,
      message: `Successfully processed ${filename}`,
      chunksCount: documentChunks.length,
    }
  } catch (error) {
    console.error('Error uploading PDF:', error)
    return {
      success: false,
      message: error.message || 'Failed to process PDF',
      chunksCount: 0,
    }
  }
}

export const clearDocuments = () => {
  documentStore = []
  return true
}
