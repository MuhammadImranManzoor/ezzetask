import { Router } from 'express'
import { requireAdmin } from '../auth.js'
import { db } from '../db.js'
import { mapMember } from '../mappers.js'

export const membersRouter = Router()

membersRouter.get('/', (_req, res) => {
  const rows = db
    .prepare(`SELECT * FROM members ORDER BY name COLLATE NOCASE`)
    .all() as never[]
  res.json(rows.map(mapMember))
})

membersRouter.post('/', requireAdmin, (req, res) => {
  const name = String(req.body?.name ?? '').trim()
  const team = req.body?.team ?? 'other'
  if (!name) {
    res.status(400).json({ error: 'Name required' })
    return
  }
  if (!['frontend', 'backend', 'other'].includes(team)) {
    res.status(400).json({ error: 'Invalid team' })
    return
  }
  const count = db.prepare(`SELECT COUNT(*) as c FROM members`).get() as {
    c: number
  }
  const member = {
    id: crypto.randomUUID(),
    name,
    color_index: count.c % 8,
    team,
    created_at: Date.now(),
  }
  db.prepare(`
    INSERT INTO members (id, name, color_index, team, created_at)
    VALUES (@id, @name, @color_index, @team, @created_at)
  `).run(member)
  res.status(201).json(mapMember(member as never))
})

membersRouter.patch('/:id', requireAdmin, (req, res) => {
  const existing = db
    .prepare(`SELECT * FROM members WHERE id = ?`)
    .get(req.params.id)
  if (!existing) {
    res.status(404).json({ error: 'Member not found' })
    return
  }
  const name =
    req.body?.name != null ? String(req.body.name).trim() : undefined
  const team = req.body?.team
  if (name !== undefined && !name) {
    res.status(400).json({ error: 'Name cannot be empty' })
    return
  }
  if (team != null && !['frontend', 'backend', 'other'].includes(team)) {
    res.status(400).json({ error: 'Invalid team' })
    return
  }
  db.prepare(`
    UPDATE members SET
      name = COALESCE(@name, name),
      team = COALESCE(@team, team)
    WHERE id = @id
  `).run({
    id: req.params.id,
    name: name ?? null,
    team: team ?? null,
  })
  const row = db.prepare(`SELECT * FROM members WHERE id = ?`).get(req.params.id)
  res.json(mapMember(row as never))
})

membersRouter.delete('/:id', requireAdmin, (req, res) => {
  const result = db.prepare(`DELETE FROM members WHERE id = ?`).run(req.params.id)
  if (result.changes === 0) {
    res.status(404).json({ error: 'Member not found' })
    return
  }
  db.prepare(`UPDATE tasks SET assignee_id = NULL WHERE assignee_id = ?`).run(
    req.params.id,
  )
  res.status(204).end()
})
