import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { apiFetch } from '../api/client'
import type {
  AnalyticsPeriod,
  Assignee,
  ProductivityReport,
  Project,
  TaskItem,
} from '../types'
import { useAuth } from './AuthContext'

type DataState = {
  projects: Project[]
  tasks: TaskItem[]
  assignees: Assignee[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  createTask: (
    input: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>,
  ) => Promise<TaskItem>
  updateTask: (id: string, patch: Partial<TaskItem>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  saveProject: (
    input: { id?: string; name: string; colorIndex: number },
  ) => Promise<Project>
  deleteProject: (id: string) => Promise<void>
  addMember: (
    name: string,
    team: Assignee['team'],
  ) => Promise<Assignee>
  updateMember: (
    id: string,
    patch: { name?: string; team?: Assignee['team'] },
  ) => Promise<void>
  deleteMember: (id: string) => Promise<void>
  fetchProductivity: (
    period: AnalyticsPeriod,
    projectId: string | null,
  ) => Promise<ProductivityReport>
}

const DataContext = createContext<DataState | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [assignees, setAssignees] = useState<Assignee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) return
    try {
      const [p, t, m] = await Promise.all([
        apiFetch<Project[]>('/api/projects'),
        apiFetch<TaskItem[]>('/api/tasks'),
        apiFetch<Assignee[]>('/api/members'),
      ])
      setProjects(p)
      setTasks(t)
      setAssignees(m)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    }
  }, [user])

  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading && !user) {
        setProjects([])
        setTasks([])
        setAssignees([])
      }
      setLoading(authLoading)
      return
    }
    setLoading(true)
    void refresh().finally(() => setLoading(false))
    const id = window.setInterval(() => void refresh(), 8000)
    return () => window.clearInterval(id)
  }, [user, authLoading, refresh])

  const createTask = useCallback(
    async (
      input: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>,
    ) => {
      const task = await apiFetch<TaskItem>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      setTasks((prev) => [task, ...prev])
      return task
    },
    [],
  )

  const updateTask = useCallback(async (id: string, patch: Partial<TaskItem>) => {
    const task = await apiFetch<TaskItem>(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: patch.title,
        taskDescription: patch.taskDescription,
        status: patch.status,
        assigneeId: patch.assigneeId,
        deadline: patch.deadline,
        notificationEnabled: patch.notificationEnabled,
      }),
    })
    setTasks((prev) => prev.map((t) => (t.id === id ? task : t)))
  }, [])

  const deleteTask = useCallback(async (id: string) => {
    await apiFetch(`/api/tasks/${id}`, { method: 'DELETE' })
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const saveProject = useCallback(
    async (input: { id?: string; name: string; colorIndex: number }) => {
      if (input.id) {
        const project = await apiFetch<Project>(`/api/projects/${input.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: input.name,
            colorIndex: input.colorIndex,
          }),
        })
        setProjects((prev) =>
          prev.map((p) => (p.id === project.id ? project : p)),
        )
        return project
      }
      const project = await apiFetch<Project>('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: input.name,
          colorIndex: input.colorIndex,
        }),
      })
      setProjects((prev) => [...prev, project])
      return project
    },
    [],
  )

  const deleteProject = useCallback(async (id: string) => {
    await apiFetch(`/api/projects/${id}`, { method: 'DELETE' })
    setProjects((prev) => prev.filter((p) => p.id !== id))
    setTasks((prev) => prev.filter((t) => t.projectId !== id))
  }, [])

  const addMember = useCallback(async (name: string, team: Assignee['team']) => {
    const member = await apiFetch<Assignee>('/api/members', {
      method: 'POST',
      body: JSON.stringify({ name, team }),
    })
    setAssignees((prev) => [...prev, member].sort((a, b) => a.name.localeCompare(b.name)))
    return member
  }, [])

  const updateMember = useCallback(
    async (id: string, patch: { name?: string; team?: Assignee['team'] }) => {
      const member = await apiFetch<Assignee>(`/api/members/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
      setAssignees((prev) =>
        prev.map((m) => (m.id === id ? member : m)),
      )
    },
    [],
  )

  const deleteMember = useCallback(async (id: string) => {
    await apiFetch(`/api/members/${id}`, { method: 'DELETE' })
    setAssignees((prev) => prev.filter((m) => m.id !== id))
    setTasks((prev) =>
      prev.map((t) => (t.assigneeId === id ? { ...t, assigneeId: null } : t)),
    )
  }, [])

  const fetchProductivity = useCallback(
    async (period: AnalyticsPeriod, projectId: string | null) => {
      const q = new URLSearchParams({ period })
      if (projectId) q.set('projectId', projectId)
      return apiFetch<ProductivityReport>(`/api/analytics/productivity?${q}`)
    },
    [],
  )

  const value = useMemo(
    () => ({
      projects,
      tasks,
      assignees,
      loading,
      error,
      refresh,
      createTask,
      updateTask,
      deleteTask,
      saveProject,
      deleteProject,
      addMember,
      updateMember,
      deleteMember,
      fetchProductivity,
    }),
    [
      projects,
      tasks,
      assignees,
      loading,
      error,
      refresh,
      createTask,
      updateTask,
      deleteTask,
      saveProject,
      deleteProject,
      addMember,
      updateMember,
      deleteMember,
      fetchProductivity,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataState {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData requires DataProvider')
  return ctx
}
