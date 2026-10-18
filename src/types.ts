export type TaskStatus = 'todo' | 'inProgress' | 'done'

export type TeamDiscipline = 'frontend' | 'backend' | 'other'

export type UserRole = 'admin' | 'member'

export type AnalyticsPeriod = '7d' | '30d' | 'all'

export type BrowseMode = 'project' | 'assignee' | 'company' | 'admin'

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
  team: TeamDiscipline
  createdAt: number
}

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  memberId: string | null
  member: Assignee | null
}

export interface MemberProductivity {
  memberId: string
  name: string
  team: TeamDiscipline
  colorIndex: number
  openTodo: number
  openInProgress: number
  openDone: number
  completedInPeriod: number
}

export interface ProductivityReport {
  period: AnalyticsPeriod
  projectId: string | null
  generatedAt: number
  summary: {
    completedInPeriod: number
    openTasks: number
    teamTotals: Record<
      TeamDiscipline,
      { completed: number; open: number; members: number }
    >
  }
  members: MemberProductivity[]
  byProject: { projectId: string; projectName: string; completedInPeriod: number }[]
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
  completedAt: number | null
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
