import cors from 'cors'
import express from 'express'
import { authMiddleware } from './auth.js'
import { db, initSchema } from './db.js'
import { analyticsRouter } from './routes/analytics.js'
import { authRouter } from './routes/auth.js'
import { membersRouter } from './routes/members.js'
import { projectsRouter } from './routes/projects.js'
import { tasksRouter } from './routes/tasks.js'

initSchema()

const memberCount = db.prepare('SELECT COUNT(*) as c FROM members').get() as {
  c: number
}
if (memberCount.c === 0) {
  console.log(
    'Database is empty. Run `npm run seed` in the server folder to load demo data.',
  )
}

const app = express()
const port = Number(process.env.PORT ?? 3001)

app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/auth', authRouter)

app.use('/api', authMiddleware)
app.use('/api/members', membersRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/analytics', analyticsRouter)

app.listen(port, () => {
  console.log(`Ezzetask API listening on http://127.0.0.1:${port}`)
})
