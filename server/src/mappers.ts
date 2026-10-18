import type { DbMember, DbProject, DbTask } from './db.js'

export function mapMember(row: DbMember) {
  return {
    id: row.id,
    name: row.name,
    colorIndex: row.color_index,
    team: row.team,
    createdAt: row.created_at,
  }
}

export function mapProject(row: DbProject) {
  return {
    id: row.id,
    name: row.name,
    colorIndex: row.color_index,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  }
}

export function mapTask(row: DbTask) {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    taskDescription: row.task_description,
    status: row.status,
    assigneeId: row.assignee_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
    deadline: row.deadline,
    notificationEnabled: row.notification_enabled === 1,
  }
}
