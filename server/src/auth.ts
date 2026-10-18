import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET =
  process.env.JWT_SECRET ?? 'dev-only-change-me-in-production-ezzetask'

export type AuthPayload = {
  userId: string
  role: 'admin' | 'member'
  memberId: string | null
  email: string
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '14d' })
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET) as AuthPayload
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  try {
    const payload = verifyToken(header.slice(7))
    ;(req as Request & { auth: AuthPayload }).auth = payload
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' })
  }
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const auth = (req as Request & { auth?: AuthPayload }).auth
  if (!auth || auth.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' })
    return
  }
  next()
}
