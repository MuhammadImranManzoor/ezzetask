import type { Assignee, TaskItem } from '../types'

export type TaskWithLegacyAssignee = TaskItem & { assignee?: string }

export function buildAssigneeNameMap(assignees: Assignee[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const a of assignees) {
    map.set(a.name.trim().toLowerCase(), a.id)
  }
  return map
}

/** Resolve assignee id from stored id or legacy text name */
export function resolveTaskAssigneeId(
  task: TaskWithLegacyAssignee,
  nameToId: Map<string, string>,
): string | null {
  if (task.assigneeId) {
    return task.assigneeId
  }
  const legacy =
    typeof task.assignee === 'string' ? task.assignee.trim().toLowerCase() : ''
  if (legacy && nameToId.has(legacy)) {
    return nameToId.get(legacy)!
  }
  return null
}

export function taskBelongsToAssignee(
  task: TaskWithLegacyAssignee,
  assigneeId: string,
  nameToId: Map<string, string>,
): boolean {
  return resolveTaskAssigneeId(task, nameToId) === assigneeId
}

export function countTasksForAssignee(
  tasks: TaskWithLegacyAssignee[],
  assigneeId: string,
  nameToId: Map<string, string>,
  openOnly = false,
): number {
  return tasks.filter((t) => {
    if (!taskBelongsToAssignee(t, assigneeId, nameToId)) return false
    if (openOnly && t.status === 'done') return false
    return true
  }).length
}
