import Dexie, { type EntityTable } from 'dexie'
import type { Assignee, Project, TaskAttachment, TaskItem } from './types'

type LegacyTask = TaskItem & { assignee?: string }

export class TaskPlannerDB extends Dexie {
  projects!: EntityTable<Project, 'id'>
  tasks!: EntityTable<TaskItem, 'id'>
  attachments!: EntityTable<TaskAttachment, 'id'>
  assignees!: EntityTable<Assignee, 'id'>

  constructor() {
    super('MacTaskPlannerWeb')
    this.version(1).stores({
      projects: 'id, sortOrder, name',
      tasks: 'id, projectId, updatedAt, status, deadline',
      attachments: 'id, taskId, sortOrder',
    })
    this.version(2)
      .stores({
        projects: 'id, sortOrder, name',
        tasks: 'id, projectId, updatedAt, status, deadline, assignee',
        attachments: 'id, taskId, sortOrder',
      })
      .upgrade((tx) =>
        tx
          .table('tasks')
          .toCollection()
          .modify((task: LegacyTask) => {
            if (task.assignee == null) task.assignee = ''
          }),
      )
    this.version(3)
      .stores({
        projects: 'id, sortOrder, name',
        tasks: 'id, projectId, updatedAt, status, deadline, assigneeId',
        attachments: 'id, taskId, sortOrder',
        assignees: 'id, name, createdAt',
      })
      .upgrade(async (tx) => {
        const assigneeTable = tx.table('assignees')
        const taskTable = tx.table('tasks')
        const existing = (await assigneeTable.toArray()) as Assignee[]
        const nameToId = new Map(
          existing.map((a) => [a.name.toLowerCase(), a.id]),
        )
        let colorIdx = existing.length

        const allTasks = (await taskTable.toArray()) as LegacyTask[]
        for (const task of allTasks) {
          let assigneeId: string | null = task.assigneeId ?? null
          const legacyName =
            typeof task.assignee === 'string' ? task.assignee.trim() : ''

          if (!assigneeId && legacyName) {
            let id = nameToId.get(legacyName.toLowerCase())
            if (!id) {
              id = crypto.randomUUID()
              await assigneeTable.add({
                id,
                name: legacyName,
                colorIndex: colorIdx % 8,
                createdAt: Date.now(),
              })
              colorIdx += 1
              nameToId.set(legacyName.toLowerCase(), id)
            }
            assigneeId = id
          }

          const updated: TaskItem = {
            id: task.id,
            projectId: task.projectId,
            title: task.title,
            taskDescription: task.taskDescription,
            status: task.status,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
            deadline: task.deadline,
            notificationEnabled: task.notificationEnabled,
            assigneeId,
            completedAt: task.status === 'done' ? task.updatedAt : null,
          }
          await taskTable.put(updated)
        }
      })
  }
}

export const db = new TaskPlannerDB()
