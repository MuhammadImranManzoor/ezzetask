import type { Page } from '@playwright/test'

const adminUser = {
  id: 'admin-1',
  email: 'admin@test.local',
  role: 'admin' as const,
  memberId: null,
  member: null,
}

const project = {
  id: 'proj-1',
  name: 'Client Portal',
  colorIndex: 1,
  createdAt: Date.now(),
  sortOrder: 0,
}

const member = {
  id: 'mem-1',
  name: 'Alex (FE)',
  colorIndex: 1,
  team: 'frontend' as const,
  createdAt: Date.now(),
}

const attachmentCounts: Record<string, number> = {}

let tasks: Array<{
  id: string
  projectId: string
  title: string
  taskDescription: string
  status: 'todo' | 'inProgress' | 'done'
  createdAt: number
  updatedAt: number
  completedAt: number | null
  deadline: number | null
  notificationEnabled: boolean
  assigneeId: string
}> = []

export async function installApiMock(page: Page) {
  tasks = []
  for (const key of Object.keys(attachmentCounts)) delete attachmentCounts[key]
  await page.route('**/*', async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    if (!url.pathname.startsWith('/api')) {
      return route.continue()
    }
    const path = url.pathname
    const method = req.method()

    if (method === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    if (method === 'GET' && path === '/api/health') {
      return route.fulfill({ json: { ok: true } })
    }
    if (method === 'POST' && path === '/api/auth/session') {
      return route.fulfill({
        json: { token: 'test-jwt-token', user: adminUser },
      })
    }
    if (method === 'GET' && path === '/api/auth/me') {
      return route.fulfill({ json: { user: adminUser } })
    }
    if (method === 'GET' && path === '/api/projects') {
      return route.fulfill({ json: [project] })
    }
    if (method === 'GET' && path === '/api/members') {
      return route.fulfill({ json: [member] })
    }
    if (method === 'GET' && path === '/api/tasks') {
      return route.fulfill({ json: tasks })
    }
    if (method === 'GET' && path === '/api/attachments/counts') {
      return route.fulfill({ json: attachmentCounts })
    }
    const taskAttachmentsMatch = path.match(/^\/api\/tasks\/([^/]+)\/attachments\/?$/)
    if (taskAttachmentsMatch) {
      const taskId = taskAttachmentsMatch[1]
      if (method === 'GET') {
        return route.fulfill({ json: [] })
      }
      if (method === 'POST') {
        attachmentCounts[taskId] = (attachmentCounts[taskId] ?? 0) + 1
        return route.fulfill({
          status: 201,
          json: {
            id: `att-${Date.now()}`,
            taskId,
            fileName: 'mock.png',
            mimeType: 'image/png',
            sortOrder: 0,
            createdAt: Date.now(),
          },
        })
      }
    }
    if (method === 'POST' && path === '/api/tasks') {
      const body = req.postDataJSON() as {
        title: string
        projectId: string
        assigneeId: string
        status: 'todo' | 'inProgress' | 'done'
      }
      const now = Date.now()
      const task = {
        id: `task-${tasks.length + 1}`,
        projectId: body.projectId,
        title: body.title,
        taskDescription: '',
        status: body.status ?? 'todo',
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        deadline: null,
        notificationEnabled: true,
        assigneeId: body.assigneeId,
      }
      tasks = [task, ...tasks]
      return route.fulfill({ json: task })
    }
    return route.fulfill({ status: 404, json: { error: 'Not found' } })
  })
}
