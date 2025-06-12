import type { Context, Next } from 'hono'
import { authService } from '../services/authService'
import { db } from '../lib/db'

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const token = authHeader.substring(7)
    const { userId } = authService.verifyToken(token)
    
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true }
    })
    
    if (!user) {
      return c.json({ error: 'User not found' }, 401)
    }

    c.set('user', user)
    await next()
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401)
  }
}