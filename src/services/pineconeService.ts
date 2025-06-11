import { Pinecone } from '@pinecone-database/pinecone'

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
})

const index = pc.index(process.env.PINECONE_INDEX_NAME!)

export class PineconeService {
  async upsertVector(data: {
    id: string
    values: number[]
    metadata: Record<string, any>
  }) {
    await index.upsert([{
      id: data.id,
      values: data.values,
      metadata: data.metadata,
    }])
    return data.id
  }

  async query(params: {
    vector: number[]
    topK: number
    filter?: Record<string, any>
    includeMetadata?: boolean
  }) {
    return await index.query({
      vector: params.vector,
      topK: params.topK,
      filter: params.filter,
      includeMetadata: params.includeMetadata,
    })
  }

  async deleteVector(id: string) {
    await index.deleteOne(id)
  }
}

export const pineconeService = new PineconeService()