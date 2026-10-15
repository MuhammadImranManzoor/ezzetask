import { db } from '../db'
import type { TaskItem } from '../types'

const timers = new Map<string, ReturnType<typeof setTimeout>>()

export type NotificationPermissionState =
  | NotificationPermission
  | 'unsupported'

export function getNotificationSupport(): NotificationPermissionState {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof Notification === 'undefined') return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.requestPermission()
}

function cancelTimer(taskId: string) {
  const t = timers.get(taskId)
  if (t) {
    clearTimeout(t)
    timers.delete(taskId)
  }
}

export function cancelNotification(taskId: string) {
  cancelTimer(taskId)
}

export async function syncNotificationForTask(task: TaskItem) {
  cancelTimer(task.id)

  if (
    typeof Notification === 'undefined' ||
    Notification.permission !== 'granted' ||
    !task.notificationEnabled ||
    task.deadline == null ||
    task.status === 'done'
  ) {
    return
  }

  const ms = task.deadline - Date.now()
  if (ms <= 0) return

  const timeout = setTimeout(async () => {
    const fresh = await db.tasks.get(task.id)
    if (!fresh || fresh.status === 'done' || !fresh.notificationEnabled) return
    new Notification(fresh.title.trim() || 'Task due', {
      body: 'Deadline reached',
      tag: fresh.id,
    })
  }, Math.min(ms, 2_147_483_647))

  timers.set(task.id, timeout)
}

export async function resyncAllNotifications() {
  for (const id of timers.keys()) cancelTimer(id)
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return
  }
  const tasks = await db.tasks.toArray()
  for (const task of tasks) {
    await syncNotificationForTask(task)
  }
}
