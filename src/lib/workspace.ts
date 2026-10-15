const PROFILE_KEY = 'task-planner-my-assignee-id'

export function getMyAssigneeId(): string | null {
  return localStorage.getItem(PROFILE_KEY)
}

export function setMyAssigneeId(id: string | null) {
  if (id) localStorage.setItem(PROFILE_KEY, id)
  else localStorage.removeItem(PROFILE_KEY)
}

import {
  buildAssigneeNameMap,
  countTasksForAssignee,
  type TaskWithLegacyAssignee,
} from './assigneeMatch'
import type { Assignee } from '../types'

export function countOpenTasksForAssignee(
  tasks: TaskWithLegacyAssignee[],
  assigneeId: string,
  assignees: Assignee[],
): number {
  const nameToId = buildAssigneeNameMap(assignees)
  return countTasksForAssignee(tasks, assigneeId, nameToId, true)
}
