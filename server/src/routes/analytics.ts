import { Router } from 'express'
import { requireAdmin } from '../auth.js'
import { db } from '../db.js'

export const analyticsRouter = Router()

type Period = '7d' | '30d' | 'all'

function periodStart(period: Period): number | null {
  const now = Date.now()
  if (period === '7d') return now - 7 * 24 * 60 * 60 * 1000
  if (period === '30d') return now - 30 * 24 * 60 * 60 * 1000
  return null
}

analyticsRouter.get('/productivity', requireAdmin, (req, res) => {
  const period = (req.query.period ?? '7d') as Period
  if (!['7d', '30d', 'all'].includes(period)) {
    res.status(400).json({ error: 'Invalid period' })
    return
  }
  const projectId =
    typeof req.query.projectId === 'string' && req.query.projectId
      ? req.query.projectId
      : null

  const since = periodStart(period)
  const members = db
    .prepare(`SELECT id, name, team, color_index FROM members ORDER BY name`)
    .all() as {
    id: string
    name: string
    team: string
    color_index: number
  }[]

  const openCounts = db
    .prepare(`
      SELECT assignee_id, status, COUNT(*) as c
      FROM tasks
      WHERE assignee_id IS NOT NULL
        AND (@project_id IS NULL OR project_id = @project_id)
      GROUP BY assignee_id, status
    `)
    .all({ project_id: projectId }) as {
    assignee_id: string
    status: string
    c: number
  }[]

  let completedSql = `
    SELECT assignee_id, COUNT(*) as completed
    FROM tasks
    WHERE status = 'done'
      AND assignee_id IS NOT NULL
      AND (@project_id IS NULL OR project_id = @project_id)
  `
  if (since != null) {
    completedSql += ` AND completed_at IS NOT NULL AND completed_at >= @since`
  }
  completedSql += ` GROUP BY assignee_id`

  const completedInPeriod = db.prepare(completedSql).all({
    project_id: projectId,
    since,
  }) as { assignee_id: string; completed: number }[]

  const byMember = members.map((m) => {
    const open = { todo: 0, inProgress: 0, done: 0 }
    for (const row of openCounts) {
      if (row.assignee_id !== m.id) continue
      if (row.status === 'todo') open.todo = row.c
      if (row.status === 'inProgress') open.inProgress = row.c
      if (row.status === 'done') open.done = row.c
    }
    const completed =
      completedInPeriod.find((c) => c.assignee_id === m.id)?.completed ?? 0
    return {
      memberId: m.id,
      name: m.name,
      team: m.team,
      colorIndex: m.color_index,
      openTodo: open.todo,
      openInProgress: open.inProgress,
      openDone: open.done,
      completedInPeriod: completed,
    }
  })

  const teamTotals = {
    frontend: { completed: 0, open: 0, members: 0 },
    backend: { completed: 0, open: 0, members: 0 },
    other: { completed: 0, open: 0, members: 0 },
  } as Record<
    string,
    { completed: number; open: number; members: number }
  >

  for (const row of byMember) {
    const bucket = teamTotals[row.team] ?? teamTotals.other!
    bucket.members += 1
    bucket.completed += row.completedInPeriod
    bucket.open += row.openTodo + row.openInProgress
  }

  const projectBreakdown = db
    .prepare(`
      SELECT p.id, p.name, COUNT(t.id) as completed
      FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
        AND t.status = 'done'
        AND t.assignee_id IS NOT NULL
        AND (@since IS NULL OR (t.completed_at IS NOT NULL AND t.completed_at >= @since))
      GROUP BY p.id
      ORDER BY p.sort_order
    `)
    .all({ since }) as { id: string; name: string; completed: number }[]

  res.json({
    period,
    projectId,
    generatedAt: Date.now(),
    summary: {
      completedInPeriod: byMember.reduce((s, m) => s + m.completedInPeriod, 0),
      openTasks: byMember.reduce(
        (s, m) => s + m.openTodo + m.openInProgress,
        0,
      ),
      teamTotals,
    },
    members: byMember,
    byProject: projectBreakdown.map((p) => ({
      projectId: p.id,
      projectName: p.name,
      completedInPeriod: p.completed,
    })),
  })
})
