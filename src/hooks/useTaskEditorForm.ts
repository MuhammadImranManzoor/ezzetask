import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TaskItem, TaskStatus } from '../types'

export type TaskEditorForm = {
  title: string
  taskDescription: string
  status: TaskStatus
  assigneeId: string | null
  hasDeadline: boolean
  deadline: number | null
  notificationEnabled: boolean
}

function fromTask(task: TaskItem): TaskEditorForm {
  return {
    title: task.title,
    taskDescription: task.taskDescription ?? '',
    status: task.status,
    assigneeId: task.assigneeId,
    hasDeadline: task.deadline != null,
    deadline: task.deadline,
    notificationEnabled: task.notificationEnabled,
  }
}

function formsEqual(a: TaskEditorForm, task: TaskItem): boolean {
  return (
    a.title === task.title &&
    a.taskDescription === (task.taskDescription ?? '') &&
    a.status === task.status &&
    a.assigneeId === task.assigneeId &&
    a.hasDeadline === (task.deadline != null) &&
    (a.hasDeadline ? a.deadline === task.deadline : task.deadline == null) &&
    a.notificationEnabled === task.notificationEnabled
  )
}

export function useTaskEditorForm(task: TaskItem | undefined, taskId: string | null) {
  const [form, setForm] = useState<TaskEditorForm>({
    title: '',
    taskDescription: '',
    status: 'todo',
    assigneeId: null,
    hasDeadline: false,
    deadline: null,
    notificationEnabled: true,
  })
  const lastTaskIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!task || !taskId) return
    if (lastTaskIdRef.current !== taskId) {
      lastTaskIdRef.current = taskId
      setForm(fromTask(task))
    }
  }, [task, taskId])

  const isDirty = useMemo(
    () => Boolean(task && !formsEqual(form, task)),
    [form, task],
  )

  useEffect(() => {
    if (!task || !taskId || isDirty) return
    setForm(fromTask(task))
  }, [task, taskId, isDirty, task?.updatedAt])

  const canSave = useMemo(
    () =>
      Boolean(
        task &&
          isDirty &&
          form.title.trim().length > 0 &&
          form.assigneeId != null &&
          form.assigneeId.length > 0,
      ),
    [task, isDirty, form.title, form.assigneeId],
  )

  const patchFromForm = useCallback((): Partial<TaskItem> => {
    return {
      title: form.title.trim(),
      taskDescription: form.taskDescription,
      status: form.status,
      assigneeId: form.assigneeId,
      deadline: form.hasDeadline ? form.deadline : null,
      notificationEnabled: form.notificationEnabled,
    }
  }, [form])

  const applySavedTask = useCallback((saved: TaskItem) => {
    setForm(fromTask(saved))
  }, [])

  const discardEdits = useCallback(() => {
    if (task) setForm(fromTask(task))
  }, [task])

  return { form, setForm, isDirty, canSave, patchFromForm, applySavedTask, discardEdits }
}
