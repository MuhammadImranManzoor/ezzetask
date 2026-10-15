import { isOverdue, isToday } from './dateFormatting'
import type { SidebarFilterId, TaskItem } from '../types'

export function filterMatches(
  filter: SidebarFilterId,
  task: TaskItem,
  now = new Date(),
): boolean {
  switch (filter) {
    case 'all':
      return true
    case 'today':
      if (!task.deadline || task.status === 'done') return false
      return isToday(new Date(task.deadline))
    case 'overdue':
      if (!task.deadline || task.status === 'done') return false
      return isOverdue(new Date(task.deadline), now)
    case 'todo':
      return task.status === 'todo'
    case 'inProgress':
      return task.status === 'inProgress'
    case 'done':
      return task.status === 'done'
  }
}

export function sortTasks(a: TaskItem, b: TaskItem): number {
  const ad = a.deadline
  const bd = b.deadline
  if (ad != null && bd != null) {
    if (ad !== bd) return ad - bd
  } else if (ad == null && bd != null) {
    return 1
  } else if (ad != null && bd == null) {
    return -1
  }
  return b.updatedAt - a.updatedAt
}
