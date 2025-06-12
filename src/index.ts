import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'

import authRoutes from './routes/auth'
import memoryRoutes from './routes/memories'
import chatRoutes from './routes/chat'
import searchRoutes from './routes/search'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000'],
  credentials: true,
}))

// Routes
app.route('/auth', authRoutes)
app.route('/api/memories', memoryRoutes)
app.route('/api/chat', chatRoutes)
app.route('/api/search', searchRoutes)

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

const port = parseInt(process.env.PORT || '8000')
console.log(`🚀 Server running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})