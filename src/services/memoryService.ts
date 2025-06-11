import { db } from '../lib/db'
import { embeddingService } from './embeddingService'
import { pineconeService } from './pineconeService'
import type { Memory, Prisma } from '@prisma/client'

export class MemoryService {
  async createMemory(userId: string, data: {
    title: string
    content: string
    url?: string
    tags?: string[]
  }): Promise<Memory> {
    // Create memory in database
    const memory = await db.memory.create({
      data: {
        ...data,
        userId,
        tags: data.tags || [],
      },
    })

    // Generate and store embedding
    try {
      const embedding = await embeddingService.generateEmbedding(
        `${data.title} ${data.content}`
      )
      
      const embeddingId = await pineconeService.upsertVector({
        id: memory.id,
        values: embedding,
        metadata: {
          userId,
          title: data.title,
          content: data.content.substring(0, 1000), // Truncate for metadata
          tags: data.tags || [],
          createdAt: memory.createdAt.toISOString(),
        },
      })

      // Update memory with embedding ID
      await db.memory.update({
        where: { id: memory.id },
        data: { embeddingId },
      })
    } catch (error) {
      console.error('Failed to create embedding:', error)
      // Continue without embedding - can be retried later
    }

    return memory
  }

  async getMemories(userId: string, options?: {
    limit?: number
    offset?: number
    tags?: string[]
    search?: string
  }): Promise<{ memories: Memory[]; total: number }> {
    const where: Prisma.MemoryWhereInput = { userId }
    
    if (options?.tags?.length) {
      where.tags = { hasSome: options.tags }
    }
    
    if (options?.search) {
      where.OR = [
        { title: { contains: options.search, mode: 'insensitive' } },
        { content: { contains: options.search, mode: 'insensitive' } },
      ]
    }

    const [memories, total] = await Promise.all([
      db.memory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 20,
        skip: options?.offset || 0,
      }),
      db.memory.count({ where }),
    ])

    return { memories, total }
  }

  async semanticSearch(userId: string, query: string, limit = 10): Promise<{
    memories: (Memory & { score: number })[];
    context: string;
  }> {
    try {
      // Generate query embedding
      const queryEmbedding = await embeddingService.generateEmbedding(query)
      
      // Search similar vectors
      const searchResults = await pineconeService.query({
        vector: queryEmbedding,
        topK: limit,
        filter: { userId },
        includeMetadata: true,
      })

      // Get full memory details
      const memoryIds = searchResults.matches.map(match => match.id)
      const memories = await db.memory.findMany({
        where: { id: { in: memoryIds } },
      })

      // Combine with scores
      const memoriesWithScores = memories.map(memory => {
        const match = searchResults.matches.find(m => m.id === memory.id)
        return {
          ...memory,
          score: match?.score || 0,
        }
      }).sort((a, b) => b.score - a.score)

      // Build context for RAG
      const context = memoriesWithScores
        .slice(0, 5) // Top 5 most relevant
        .map(m => `Title: ${m.title}\nContent: ${m.content}\nTags: ${m.tags.join(', ')}\n`)
        .join('\n---\n')

      return { memories: memoriesWithScores, context }
    } catch (error) {
      console.error('Semantic search failed:', error)
      // Fallback to traditional search
      const { memories } = await this.getMemories(userId, { search: query, limit })
      return {
        memories: memories.map(m => ({ ...m, score: 0.5 })),
        context: memories.map(m => `${m.title}: ${m.content}`).join('\n'),
      }
    }
  }

  async updateMemory(id: string, userId: string, data: Partial<Memory>): Promise<Memory> {
    const memory = await db.memory.update({
      where: { id, userId },
      data,
    })

    // Re-generate embedding if content changed
    if (data.title || data.content) {
      try {
        const embedding = await embeddingService.generateEmbedding(
          `${memory.title} ${memory.content}`
        )
        
        await pineconeService.upsertVector({
          id: memory.id,
          values: embedding,
          metadata: {
            userId,
            title: memory.title,
            content: memory.content.substring(0, 1000),
            tags: memory.tags,
            createdAt: memory.createdAt.toISOString(),
          },
        })
      } catch (error) {
        console.error('Failed to update embedding:', error)
      }
    }

    return memory
  }

  async deleteMemory(id: string, userId: string): Promise<void> {
    const memory = await db.memory.findFirst({
      where: { id, userId },
    })

    if (!memory) {
      throw new Error('Memory not found')
    }

    // Delete from vector database
    if (memory.embeddingId) {
      try {
        await pineconeService.deleteVector(memory.id)
      } catch (error) {
        console.error('Failed to delete vector:', error)
      }
    }

    // Delete from database
    await db.memory.delete({
      where: { id, userId },
    })
  }
}

export const memoryService = new MemoryService()