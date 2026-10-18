import { Router } from 'express'
import { authMiddleware, signToken } from '../auth.js'
import { db } from '../db.js'
import { mapMember } from '../mappers.js'

export const authRouter = Router()

function sessionForUser(user: {
  id: string
  email: string
  role: 'admin' | 'member'
  member_id: string | null
}) {
  let member = null
  if (user.member_id) {
    const row = db
      .prepare(`SELECT * FROM members WHERE id = ?`)
      .get(user.member_id)
    if (row) member = mapMember(row as never)
  }
  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    memberId: user.member_id,
  })
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      memberId: user.member_id,
      member,
    },
  }
}

/** Opens the app without sign-in — uses the first admin account. */
authRouter.post('/session', (_req, res) => {
  const user = db
    .prepare(
      `SELECT id, email, role, member_id FROM users WHERE role = 'admin' ORDER BY created_at LIMIT 1`,
    )
    .get() as
    | {
        id: string
        email: string
        role: 'admin' | 'member'
        member_id: string | null
      }
    | undefined

  if (!user) {
    res.status(503).json({ error: 'No admin account configured. Run npm run seed.' })
    return
  }

  res.json(sessionForUser(user))
})

authRouter.post('/login', (req, res) => {
  const email = String(req.body?.email ?? '')
    .trim()
    .toLowerCase()
  if (!email) {
    res.status(400).json({ error: 'Email required' })
    return
  }

  const user = db
    .prepare(`SELECT id, email, role, member_id FROM users WHERE email = ?`)
    .get(email) as
    | {
        id: string
        email: string
        role: 'admin' | 'member'
        member_id: string | null
      }
    | undefined

  if (!user) {
    res.status(401).json({ error: 'No account for this email' })
    return
  }

  res.json(sessionForUser(user))
})

authRouter.get('/me', authMiddleware, (req, res) => {
  const auth = (req as typeof req & { auth: { userId: string } }).auth
  const user = db
    .prepare(`SELECT id, email, role, member_id FROM users WHERE id = ?`)
    .get(auth.userId) as
    | {
        id: string
        email: string
        role: 'admin' | 'member'
        member_id: string | null
      }
    | undefined

  if (!user) {
    res.status(401).json({ error: 'User not found' })
    return
  }

  let member = null
  if (user.member_id) {
    const row = db
      .prepare(`SELECT * FROM members WHERE id = ?`)
      .get(user.member_id)
    if (row) member = mapMember(row as never)
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      memberId: user.member_id,
      member,
    },
  })
})
