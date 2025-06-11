import { Mistral } from '@mistralai/mistralai'

const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY!,
})

export class EmbeddingService {
  async generateEmbedding(text: string): Promise<number[]> {
    const response = await mistral.embeddings.create({
      model: 'mistral-embed',
      inputs: [text],
    })
    
    if (!response.data[0].embedding) {
      throw new Error('Embedding is undefined');
    }
    return response.data[0].embedding;
  }
}

export const embeddingService = new EmbeddingService()