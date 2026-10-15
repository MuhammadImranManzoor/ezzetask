import { taskBelongsToAssignee, type TaskWithLegacyAssignee } from './assigneeMatch'
import type { BrowseMode } from '../types'

export function tasksInScope(
  tasks: TaskWithLegacyAssignee[],
  browseMode: BrowseMode,
  projectId: string | null,
): TaskWithLegacyAssignee[] {
  if (browseMode === 'project') {
    if (!projectId) return []
    return tasks.filter((t) => t.projectId === projectId)
  }
  return tasks
}

export function applyAssigneeFilter(
  tasks: TaskWithLegacyAssignee[],
  assigneeFilterId: string | null,
  nameToId: Map<string, string>,
): TaskWithLegacyAssignee[] {
  if (!assigneeFilterId) return tasks
  return tasks.filter((t) => taskBelongsToAssignee(t, assigneeFilterId, nameToId))
}

export function visibleTasks(
  tasks: TaskWithLegacyAssignee[],
  browseMode: BrowseMode,
  projectId: string | null,
  assigneeFilterId: string | null,
  nameToId: Map<string, string>,
): TaskWithLegacyAssignee[] {
  if (browseMode === 'assignee' && !assigneeFilterId) return []
  let result = tasksInScope(tasks, browseMode, projectId)
  result = applyAssigneeFilter(result, assigneeFilterId, nameToId)
  return result
}
