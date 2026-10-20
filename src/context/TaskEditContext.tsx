import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export type TaskEditState = {
  taskId: string | null
  isDirty: boolean
  draftTitle: string
}

const emptyState: TaskEditState = {
  taskId: null,
  isDirty: false,
  draftTitle: '',
}

type TaskEditContextValue = {
  state: TaskEditState
  setEditorState: (patch: Partial<TaskEditState>) => void
  isDirtyForTask: (taskId: string | null) => boolean
  registerDiscardHandler: (fn: (() => void) | null) => void
  discardEdits: () => void
}

const TaskEditContext = createContext<TaskEditContextValue | null>(null)

export function TaskEditProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TaskEditState>(emptyState)
  const stateRef = useRef(state)
  stateRef.current = state

  const setEditorState = useCallback((patch: Partial<TaskEditState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch }
      stateRef.current = next
      return next
    })
  }, [])

  const isDirtyForTask = useCallback((taskId: string | null) => {
    const s = stateRef.current
    return Boolean(taskId && s.isDirty && s.taskId === taskId)
  }, [])

  const discardHandlerRef = useRef<(() => void) | null>(null)

  const registerDiscardHandler = useCallback((fn: (() => void) | null) => {
    discardHandlerRef.current = fn
  }, [])

  const discardEdits = useCallback(() => {
    discardHandlerRef.current?.()
  }, [])

  const value = useMemo(
    () => ({
      state,
      setEditorState,
      isDirtyForTask,
      registerDiscardHandler,
      discardEdits,
    }),
    [state, setEditorState, isDirtyForTask, registerDiscardHandler, discardEdits],
  )

  return (
    <TaskEditContext.Provider value={value}>{children}</TaskEditContext.Provider>
  )
}

export function useTaskEdit(): TaskEditContextValue {
  const ctx = useContext(TaskEditContext)
  if (!ctx) throw new Error('useTaskEdit requires TaskEditProvider')
  return ctx
}
