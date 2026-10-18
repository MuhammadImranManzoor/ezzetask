import { Router } from 'express'
import { db } from '../db.js'
import { mapTask } from '../mappers.js'

export const tasksRouter = Router()

function applyStatusTimestamps(
  status: 'todo' | 'inProgress' | 'done',
  previousCompletedAt: number | null,
): { completed_at: number | null; updated_at: number } {
  const updated_at = Date.now()
  if (status === 'done') {
    return { completed_at: previousCompletedAt ?? updated_at, updated_at }
  }
  return { completed_at: null, updated_at }
}

tasksRouter.get('/', (_req, res) => {
  const rows = db.prepare(`SELECT * FROM tasks ORDER BY updated_at DESC`).all() as never[]
  res.json(rows.map(mapTask))
})

tasksRouter.post('/', (req, res) => {
  const title = String(req.body?.title ?? '').trim()
  const projectId = String(req.body?.projectId ?? '')
  const assigneeId = req.body?.assigneeId ?? null
  const status = (req.body?.status ?? 'todo') as 'todo' | 'inProgress' | 'done'
  if (!title || !projectId) {
    res.status(400).json({ error: 'Title and project required' })
    return
  }
  if (!assigneeId) {
    res.status(400).json({ error: 'Assignee required' })
    return
  }
  const project = db.prepare(`SELECT id FROM projects WHERE id = ?`).get(projectId)
  if (!project) {
    res.status(400).json({ error: 'Invalid project' })
    return
  }
  const now = Date.now()
  const { completed_at, updated_at } = applyStatusTimestamps(status, null)
  const task = {
    id: crypto.randomUUID(),
    project_id: projectId,
    title,
    task_description: String(req.body?.taskDescription ?? ''),
    status,
    assignee_id: assigneeId,
    created_at: now,
    updated_at,
    completed_at,
    deadline: req.body?.deadline ?? null,
    notification_enabled: req.body?.notificationEnabled === false ? 0 : 1,
  }
  db.prepare(`
    INSERT INTO tasks (
      id, project_id, title, task_description, status, assignee_id,
      created_at, updated_at, completed_at, deadline, notification_enabled
    ) VALUES (
      @id, @project_id, @title, @task_description, @status, @assignee_id,
      @created_at, @updated_at, @completed_at, @deadline, @notification_enabled
    )
  `).run(task)
  res.status(201).json(mapTask(task as never))
})

tasksRouter.patch('/:id', (req, res) => {
  const existing = db
    .prepare(`SELECT * FROM tasks WHERE id = ?`)
    .get(req.params.id) as import('../db.js').DbTask | undefined
  if (!existing) {
    res.status(404).json({ error: 'Task not found' })
    return
  }

  const nextStatus = (req.body?.status ?? existing.status) as typeof existing.status
  const { completed_at, updated_at } = applyStatusTimestamps(
    nextStatus,
    existing.completed_at,
  )

  db.prepare(`
    UPDATE tasks SET
      title = COALESCE(@title, title),
      task_description = COALESCE(@task_description, task_description),
      status = @status,
      assignee_id = COALESCE(@assignee_id, assignee_id),
      deadline = COALESCE(@deadline, deadline),
      notification_enabled = COALESCE(@notification_enabled, notification_enabled),
      updated_at = @updated_at,
      completed_at = @completed_at
    WHERE id = @id
  `).run({
    id: req.params.id,
    title: req.body?.title != null ? String(req.body.title).trim() : null,
    task_description:
      req.body?.taskDescription != null
        ? String(req.body.taskDescription)
        : null,
    status: nextStatus,
    assignee_id: req.body?.assigneeId !== undefined ? req.body.assigneeId : null,
    deadline: req.body?.deadline !== undefined ? req.body.deadline : null,
    notification_enabled:
      req.body?.notificationEnabled !== undefined
        ? req.body.notificationEnabled
          ? 1
          : 0
        : null,
    updated_at,
    completed_at,
  })

  const row = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(req.params.id)
  res.json(mapTask(row as never))
})

tasksRouter.delete('/:id', (req, res) => {
  const result = db.prepare(`DELETE FROM tasks WHERE id = ?`).run(req.params.id)
  if (result.changes === 0) {
    res.status(404).json({ error: 'Task not found' })
    return
  }
  res.status(204).end()
})
