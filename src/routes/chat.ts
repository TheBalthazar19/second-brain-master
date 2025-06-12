import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'

const chat = new Hono()
chat.use('*', authMiddleware)

chat.post('/message', (c) => c.json({ message: 'Chat endpoint - TODO' }))

export default chat