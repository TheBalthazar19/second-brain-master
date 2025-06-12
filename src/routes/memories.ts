import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'

const memories = new Hono()
memories.use('*', authMiddleware)

memories.get('/', (c) => c.json({ message: 'Memories route - TODO' }))
memories.post('/', (c) => c.json({ message: 'Create memory - TODO' }))

export default memories