import { Router } from 'express'
import { requireAdmin } from '../auth.js'
import { db } from '../db.js'
import { mapProject } from '../mappers.js'

export const projectsRouter = Router()

projectsRouter.get('/', (_req, res) => {
  const rows = db
    .prepare(`SELECT * FROM projects ORDER BY sort_order, created_at`)
    .all() as never[]
  res.json(rows.map(mapProject))
})

projectsRouter.post('/', requireAdmin, (req, res) => {
  const name = String(req.body?.name ?? '').trim()
  const colorIndex = Number(req.body?.colorIndex ?? 0)
  if (!name) {
    res.status(400).json({ error: 'Name required' })
    return
  }
  const last = db
    .prepare(`SELECT sort_order FROM projects ORDER BY sort_order DESC LIMIT 1`)
    .get() as { sort_order: number } | undefined
  const project = {
    id: crypto.randomUUID(),
    name,
    color_index: colorIndex,
    sort_order: (last?.sort_order ?? -1) + 1,
    created_at: Date.now(),
  }
  db.prepare(`
    INSERT INTO projects (id, name, color_index, sort_order, created_at)
    VALUES (@id, @name, @color_index, @sort_order, @created_at)
  `).run(project)
  res.status(201).json(mapProject(project as never))
})

projectsRouter.patch('/:id', requireAdmin, (req, res) => {
  const row = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(req.params.id)
  if (!row) {
    res.status(404).json({ error: 'Project not found' })
    return
  }
  const name =
    req.body?.name != null ? String(req.body.name).trim() : undefined
  const colorIndex =
    req.body?.colorIndex != null ? Number(req.body.colorIndex) : undefined
  if (name !== undefined && !name) {
    res.status(400).json({ error: 'Name cannot be empty' })
    return
  }
  db.prepare(`
    UPDATE projects SET
      name = COALESCE(@name, name),
      color_index = COALESCE(@color_index, color_index)
    WHERE id = @id
  `).run({
    id: req.params.id,
    name: name ?? null,
    color_index: colorIndex ?? null,
  })
  const updated = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(req.params.id)
  res.json(mapProject(updated as never))
})

projectsRouter.delete('/:id', requireAdmin, (req, res) => {
  const result = db.prepare(`DELETE FROM projects WHERE id = ?`).run(req.params.id)
  if (result.changes === 0) {
    res.status(404).json({ error: 'Project not found' })
    return
  }
  res.status(204).end()
})
