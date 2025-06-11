import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'

import authRoutes from './routes/auth'
import memoryRoutes from './routes/memories'
import chatRoutes from './routes/chat'
import searchRoutes from './routes/search'
import { authMiddleware } from './middleware/auth'
import { rateLimitMiddleware } from './middleware/rateLimit'
import { errorHandler } from './middleware/errorHandler'

const app = new Hono()

// Global middleware
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', secureHeaders())
app.use('*', cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000'],
  credentials: true,
}))

// Rate limiting
app.use('*', rateLimitMiddleware)

// Routes
app.route('/auth', authRoutes)
app.route('/api/memories', memoryRoutes)
app.route('/api/chat', chatRoutes)
app.route('/api/search', searchRoutes)

// Protected routes middleware
app.use('/api/*', authMiddleware)

// Error handling
app.onError(errorHandler)

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

export default {
  port: process.env.PORT || 8000,
  fetch: app.fetch,
}