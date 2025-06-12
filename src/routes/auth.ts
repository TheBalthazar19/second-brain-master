import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authService } from '../services/authService'

const auth = new Hono()

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

auth.post('/register', zValidator('json', registerSchema), async (c) => {
  try {
    const { email, password, name } = c.req.valid('json')
    const result = await authService.register(email, password, name)
    return c.json(result, 201)
  } catch (error) {
    return c.json({ error: error.message }, 400)
  }
})

auth.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid('json')
    const result = await authService.login(email, password)
    return c.json(result)
  } catch (error) {
    return c.json({ error: error.message }, 401)
  }
})

export default auth 