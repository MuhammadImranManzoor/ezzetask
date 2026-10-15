import { useCallback, useEffect, useRef, useState } from 'react'
import type { TaskItem } from '../types'

type TextFields = {
  title: string
  taskDescription: string
}

/**
 * Keeps title/description in local state while typing so live DB queries
 * cannot fight the caret or mirror text across fields.
 */
export function useTaskFieldDraft(
  task: TaskItem | undefined,
  taskId: string | null,
  onPersist: (patch: Partial<TaskItem>) => void | Promise<void>,
  debounceMs = 400,
) {
  const [draft, setDraft] = useState<TextFields>({ title: '', taskDescription: '' })
  const draftRef = useRef(draft)
  draftRef.current = draft
  const focusedRef = useRef<'title' | 'description' | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTaskIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!task || !taskId) return

    if (lastTaskIdRef.current !== taskId) {
      lastTaskIdRef.current = taskId
      setDraft({
        title: task.title,
        taskDescription: task.taskDescription ?? '',
      })
      return
    }

    setDraft((prev) => ({
      title: focusedRef.current === 'title' ? prev.title : task.title,
      taskDescription:
        focusedRef.current === 'description'
          ? prev.taskDescription
          : (task.taskDescription ?? ''),
    }))
  }, [task, taskId])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  const schedulePersist = useCallback(
    (patch: Partial<TaskItem>) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        void onPersist(patch)
      }, debounceMs)
    },
    [debounceMs, onPersist],
  )

  const flushPersist = useCallback(
    (patch: Partial<TaskItem>) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      void onPersist(patch)
    },
    [onPersist],
  )

  const setTitle = useCallback(
    (title: string) => {
      setDraft((d) => ({ ...d, title }))
      schedulePersist({ title })
    },
    [schedulePersist],
  )

  const setDescription = useCallback(
    (taskDescription: string) => {
      setDraft((d) => ({ ...d, taskDescription }))
      schedulePersist({ taskDescription })
    },
    [schedulePersist],
  )

  const onTitleFocus = () => {
    focusedRef.current = 'title'
  }
  const onDescriptionFocus = () => {
    focusedRef.current = 'description'
  }
  const onFieldBlur = (field: 'title' | 'description') => {
    focusedRef.current = null
    if (field === 'title') flushPersist({ title: draftRef.current.title })
    else flushPersist({ taskDescription: draftRef.current.taskDescription })
  }

  return {
    draft,
    setTitle,
    setDescription,
    onTitleFocus,
    onDescriptionFocus,
    onTitleBlur: () => onFieldBlur('title'),
    onDescriptionBlur: () => onFieldBlur('description'),
  }
}
