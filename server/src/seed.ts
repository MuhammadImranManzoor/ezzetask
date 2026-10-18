import bcrypt from 'bcryptjs'
import { db, initSchema } from './db.js'

initSchema()

const memberCount = db.prepare('SELECT COUNT(*) as c FROM members').get() as {
  c: number
}
if (memberCount.c > 0) {
  console.log('Database already seeded.')
  process.exit(0)
}

const now = Date.now()

const members = [
  { id: crypto.randomUUID(), name: 'Alex (FE)', team: 'frontend', color: 1 },
  { id: crypto.randomUUID(), name: 'Sam (FE)', team: 'frontend', color: 2 },
  { id: crypto.randomUUID(), name: 'Jordan (BE)', team: 'backend', color: 3 },
  { id: crypto.randomUUID(), name: 'Riley (BE)', team: 'backend', color: 4 },
] as const

const insertMember = db.prepare(`
  INSERT INTO members (id, name, color_index, team, created_at)
  VALUES (@id, @name, @color_index, @team, @created_at)
`)

for (const m of members) {
  insertMember.run({
    id: m.id,
    name: m.name,
    color_index: m.color,
    team: m.team,
    created_at: now,
  })
}

const projects = [
  { name: 'Client Portal', color: 1, sort: 0 },
  { name: 'Mobile App', color: 2, sort: 1 },
  { name: 'Internal Tools', color: 4, sort: 2 },
]

const insertProject = db.prepare(`
  INSERT INTO projects (id, name, color_index, sort_order, created_at)
  VALUES (@id, @name, @color_index, @sort_order, @created_at)
`)

const projectIds: string[] = []
for (const p of projects) {
  const id = crypto.randomUUID()
  projectIds.push(id)
  insertProject.run({
    id,
    name: p.name,
    color_index: p.color,
    sort_order: p.sort,
    created_at: now,
  })
}

const insertTask = db.prepare(`
  INSERT INTO tasks (
    id, project_id, title, task_description, status, assignee_id,
    created_at, updated_at, completed_at, deadline, notification_enabled
  ) VALUES (
    @id, @project_id, @title, @task_description, @status, @assignee_id,
    @created_at, @updated_at, @completed_at, @deadline, @notification_enabled
  )
`)

const day = 24 * 60 * 60 * 1000
const sampleTasks = [
  {
    title: 'Dashboard layout polish',
    member: 0,
    project: 0,
    status: 'done' as const,
    daysAgo: 2,
  },
  {
    title: 'Auth token refresh',
    member: 2,
    project: 0,
    status: 'inProgress' as const,
    daysAgo: 0,
  },
  {
    title: 'Push notification hook',
    member: 1,
    project: 1,
    status: 'todo' as const,
    daysAgo: 0,
  },
  {
    title: 'Reporting API endpoints',
    member: 3,
    project: 2,
    status: 'done' as const,
    daysAgo: 5,
  },
  {
    title: 'Migrate legacy users',
    member: 2,
    project: 2,
    status: 'done' as const,
    daysAgo: 12,
  },
]

for (const t of sampleTasks) {
  const created = now - t.daysAgo * day
  const completed =
    t.status === 'done' ? created + 6 * 60 * 60 * 1000 : null
  insertTask.run({
    id: crypto.randomUUID(),
    project_id: projectIds[t.project]!,
    title: t.title,
    task_description: '',
    status: t.status,
    assignee_id: members[t.member]!.id,
    created_at: created,
    updated_at: completed ?? created,
    completed_at: completed,
    deadline: null,
    notification_enabled: 1,
  })
}

const unusedPasswordHash = bcrypt.hashSync('unused', 10)

db.prepare(`
  INSERT INTO users (id, email, password_hash, role, member_id, created_at)
  VALUES (@id, @email, @password_hash, @role, @member_id, @created_at)
`).run({
  id: crypto.randomUUID(),
  email: 'admin@ezzetask.local',
  password_hash: unusedPasswordHash,
  role: 'admin',
  member_id: null,
  created_at: now,
})

db.prepare(`
  INSERT INTO users (id, email, password_hash, role, member_id, created_at)
  VALUES (@id, @email, @password_hash, @role, @member_id, @created_at)
`).run({
  id: crypto.randomUUID(),
  email: 'alex@ezzetask.local',
  password_hash: unusedPasswordHash,
  role: 'member',
  member_id: members[0]!.id,
  created_at: now,
})

console.log('Seeded database with demo team, projects, and tasks.')
console.log('Admin sign-in: admin@ezzetask.local')
console.log('Member sign-in: alex@ezzetask.local')
