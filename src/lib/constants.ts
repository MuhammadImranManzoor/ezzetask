import type { SidebarFilterId, TaskStatus } from '../types'

export const APP_NAME = 'Ezzetask'
export const APP_TAGLINE = 'Assign work · track by person'

/** Muted dots for project folders — not loud fills */
export const PROJECT_COLORS = [
  '#525252',
  '#0369a1',
  '#0f766e',
  '#7c3aed',
  '#b45309',
  '#15803d',
  '#be185d',
  '#4338ca',
] as const

export function projectColor(index: number): string {
  const n = PROJECT_COLORS.length
  return PROJECT_COLORS[((index % n) + n) % n]
}

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'To Do',
  inProgress: 'In Progress',
  done: 'Done',
}

export const SIDEBAR_FILTERS: {
  id: SidebarFilterId
  title: string
}[] = [
  { id: 'all', title: 'All' },
  { id: 'today', title: 'Today' },
  { id: 'overdue', title: 'Overdue' },
  { id: 'todo', title: 'To Do' },
  { id: 'inProgress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
]

export const INBOX_PROJECT_NAME = 'Inbox'
