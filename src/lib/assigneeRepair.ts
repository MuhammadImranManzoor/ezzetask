import { db } from '../db'
import { buildAssigneeNameMap, type TaskWithLegacyAssignee } from './assigneeMatch'

/** Link tasks to assignee ids by name (fixes older or mismatched data). */
export async function repairTaskAssigneeLinks(): Promise<number> {
  const assignees = await db.assignees.toArray()
  const nameToId = buildAssigneeNameMap(assignees)
  const tasks = (await db.tasks.toArray()) as TaskWithLegacyAssignee[]
  let fixed = 0

  for (const task of tasks) {
    const legacyName =
      typeof task.assignee === 'string' ? task.assignee.trim().toLowerCase() : ''
    let nextId = task.assigneeId

    if (!nextId && legacyName && nameToId.has(legacyName)) {
      nextId = nameToId.get(legacyName)!
    }

    if (nextId !== task.assigneeId) {
      await db.tasks.update(task.id, { assigneeId: nextId })
      fixed += 1
    }
  }

  return fixed
}
