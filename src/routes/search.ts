import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'

const search = new Hono()
search.use('*', authMiddleware)

search.get('/', (c) => c.json({ message: 'Search endpoint - TODO' }))

export default search