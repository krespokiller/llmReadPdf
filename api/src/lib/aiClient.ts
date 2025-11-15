// AI Client for calling local models via OpenAI-compatible API
const AI_BASE_URL =
  process.env.AI_BASE_URL || 'http://localhost:12434/engines/llama.cpp/v1'

export interface EmbeddingResponse {
  data: Array<{
    embedding: number[]
    index: number
  }>
  model: string
  usage: {
    prompt_tokens: number
    total_tokens: number
  }
}

export interface ChatResponse {
  choices: Array<{
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  model: string
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * Generate embeddings using ai/embeddinggemma:latest model
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch(`${AI_BASE_URL}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'ai/embeddinggemma:latest',
        input: text,
      }),
    })

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.statusText}`)
    }

    const data: EmbeddingResponse = await response.json()
    return data.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error
  }
}

/**
 * Generate chat completion using ai/deepseek-r1-distill-llama:latest model
 */
export async function generateChatCompletion(
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'ai/deepseek-r1-distill-llama:latest',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error(`Chat API error: ${response.statusText}`)
    }

    const data: ChatResponse = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error('Error generating chat completion:', error)
    throw error
  }
}
