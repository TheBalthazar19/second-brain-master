import bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import { db } from '../lib/db'

export class AuthService {
  async register(email: string, password: string, name?: string) {
    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      throw new Error('User already exists')
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    })

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!)
    return { user: { id: user.id, email: user.email, name: user.name }, token }
  }

  async login(email: string, password: string) {
    const user = await db.user.findUnique({ where: { email } })
    if (!user) {
      throw new Error('Invalid credentials')
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      throw new Error('Invalid credentials')
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!)
    return { user: { id: user.id, email: user.email, name: user.name }, token }
  }

  verifyToken(token: string) {
    return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
  }
}

export const authService = new AuthService()