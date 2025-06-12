const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    return response.json()
  }

  // Auth methods
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async signup(email: string, password: string, name?: string) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
  }

  async getSession() {
    return this.request('/auth/session')
  }

  // Memory methods
  async getMemories(params?: {
    limit?: number
    offset?: number
    search?: string
    tags?: string[]
  }) {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.offset) searchParams.set('offset', params.offset.toString())
    if (params?.search) searchParams.set('search', params.search)
    if (params?.tags?.length) searchParams.set('tags', params.tags.join(','))

    return this.request(`/api/memories?${searchParams}`)
  }

  async createMemory(data: {
    title: string
    content: string
    url?: string
    tags?: string[]
  }) {
    return this.request('/api/memories', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateMemory(id: string, data: Partial<{
    title: string
    content: string
    url?: string
    tags?: string[]
  }>) {
    return this.request(`/api/memories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteMemory(id: string) {
    return this.request(`/api/memories/${id}`, {
      method: 'DELETE',
    })
  }

  // Chat methods
  async sendMessage(message: string, sessionId?: string) {
    return this.request('/api/chat/message', {
      method: 'POST',
      body: JSON.stringify({ message, sessionId }),
    })
  }
}

export const api = new ApiClient(API_BASE_URL)
