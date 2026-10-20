import type { TaskItem } from '../types'

/** Keep server list plus local rows still pending on the server (avoid create → refresh races). */
export function mergeTasks(
  server: TaskItem[],
  local: TaskItem[],
  pendingIds: ReadonlySet<string>,
): TaskItem[] {
  const byId = new Map(server.map((t) => [t.id, t]))
  for (const id of pendingIds) {
    if (byId.has(id)) continue
    const row = local.find((t) => t.id === id)
    if (row) byId.set(id, row)
  }
  return [...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt)
}
