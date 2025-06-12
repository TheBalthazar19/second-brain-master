export interface User {
  id: string
  email: string
  name?: string
  createdAt: string
  updatedAt: string
}

export interface Memory {
  id: string
  title: string
  content: string
  url?: string
  tags: string[]
  userId: string
  createdAt: string
  updatedAt: string
  embeddingId?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  references?: Array<{
    id: string
    title: string
    score: number
  }>
  createdAt: string
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}
