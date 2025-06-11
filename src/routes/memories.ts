import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { memoryService } from '../services/memoryService'
import { authMiddleware } from '../middleware/auth'

const memories = new Hono()

// Apply auth middleware to all routes
memories.use('*', authMiddleware)

const createMemorySchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  url: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
})

const updateMemorySchema = createMemorySchema.partial()

// GET /api/memories
memories.get('/', async (c) => {
  const userId = c.get('user').id
  const limit = Number(c.req.query('limit')) || 20
  const offset = Number(c.req.query('offset')) || 0
  const tags = c.req.query('tags')?.split(',').filter(Boolean)
  const search = c.req.query('search')

  const result = await memoryService.getMemories(userId, {
    limit,
    offset,
    tags,
    search,
  })

  return c.json(result)
})

// POST /api/memories
memories.post('/', zValidator('json', createMemorySchema), async (c) => {
  const userId = c.get('user').id
  const data = c.req.valid('json')

  const memory = await memoryService.createMemory(userId, data)
  return c.json(memory, 201)
})

// GET /api/memories/:id
memories.get('/:id', async (c) => {
  const id = c.req.param('id')
  const userId = c.get('user').id

  const memory = await db.memory.findFirst({
    where: { id, userId }
  })

  if (!memory) {
    return c.json({ error: 'Memory not found' }, 404)
  }

  return c.json(memory)
})

// PUT /api/memories/:id
memories.put('/:id', zValidator('json', updateMemorySchema), async (c) => {
  const id = c.req.param('id')
  const userId = c.get('user').id
  const data = c.req.valid('json')

  try {
    const memory = await memoryService.updateMemory(id, userId, data)
    return c.json(memory)
  } catch (error) {
    return c.json({ error: 'Memory not found' }, 404)
  }
})

// DELETE /api/memories/:id
memories.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const userId = c.get('user').id

  try {
    await memoryService.deleteMemory(id, userId)
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Memory not found' }, 404)
  }
})

export default memories