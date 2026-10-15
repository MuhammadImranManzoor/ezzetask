export type TaskStatus = 'todo' | 'inProgress' | 'done'

export type BrowseMode = 'project' | 'assignee' | 'company'

export type SidebarFilterId =
  | 'all'
  | 'today'
  | 'overdue'
  | 'todo'
  | 'inProgress'
  | 'done'

export interface Assignee {
  id: string
  name: string
  colorIndex: number
  createdAt: number
}

export interface Project {
  id: string
  name: string
  colorIndex: number
  createdAt: number
  sortOrder: number
}

export interface TaskItem {
  id: string
  projectId: string
  title: string
  taskDescription: string
  status: TaskStatus
  createdAt: number
  updatedAt: number
  deadline: number | null
  notificationEnabled: boolean
  assigneeId: string | null
}

export interface TaskAttachment {
  id: string
  taskId: string
  fileName: string
  mimeType: string
  blob: Blob
  sortOrder: number
}
