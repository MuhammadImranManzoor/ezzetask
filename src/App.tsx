import { useCallback, useEffect, useMemo, useState } from 'react'
import { AdminDashboard } from './components/AdminDashboard'
import { AppHeader } from './components/AppHeader'
import { AssigneesModal } from './components/AssigneesModal'
import { NewTaskModal } from './components/NewTaskModal'
import { ProjectModal } from './components/ProjectModal'
import { ProjectsManageModal } from './components/ProjectsManageModal'
import { TaskDetailPanel } from './components/TaskDetailPanel'
import { TaskListPanel } from './components/TaskListPanel'
import { cn, GhostButton } from './components/ui'
import { useAuth } from './context/AuthContext'
import { useData } from './context/DataContext'
import {
  cancelNotification,
  resyncAllNotifications,
} from './services/notifications'
import type { BrowseMode, Project, SidebarFilterId, TaskStatus } from './types'

export default function App() {
  const { user, loading: authLoading, isAdmin } = useAuth()
  const {
    projects,
    tasks,
    assignees,
    loading: dataLoading,
    error,
    createTask,
    saveProject,
    deleteProject,
  } = useData()

  const myAssigneeId = user?.memberId ?? null

  const [browseMode, setBrowseMode] = useState<BrowseMode>('project')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [assigneeFilterId, setAssigneeFilterId] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [sidebarFilter, setSidebarFilter] = useState<SidebarFilterId>('all')
  const [searchText, setSearchText] = useState('')
  const [newTaskOpen, setNewTaskOpen] = useState(false)
  const [assigneesOpen, setAssigneesOpen] = useState(false)
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [projectsManageOpen, setProjectsManageOpen] = useState(false)
  const [deleteProjectTarget, setDeleteProjectTarget] = useState<Project | null>(null)
  const [composeTaskId, setComposeTaskId] = useState<string | null>(null)

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0]?.id ?? null)
      setBrowseMode('project')
    }
    if (
      selectedProjectId &&
      projects.length > 0 &&
      !projects.some((p) => p.id === selectedProjectId)
    ) {
      setSelectedProjectId(projects[0]?.id ?? null)
      setSelectedTaskId(null)
    }
  }, [projects, selectedProjectId])

  useEffect(() => {
    if (selectedTaskId && tasks.length > 0 && !tasks.some((t) => t.id === selectedTaskId)) {
      setSelectedTaskId(null)
    }
  }, [tasks, selectedTaskId])

  useEffect(() => {
    if (tasks.length > 0) void resyncAllNotifications(tasks)
  }, [tasks])

  const openByProject = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of tasks) {
      if (t.status === 'done') continue
      map.set(t.projectId, (map.get(t.projectId) ?? 0) + 1)
    }
    return map
  }, [tasks])

  const attachmentCounts = useMemo(() => new Map<string, number>(), [])

  const assigneeById = useMemo(() => {
    return new Map(assignees.map((a) => [a.id, a]))
  }, [assignees])

  const projectsById = useMemo(() => {
    return new Map(projects.map((p) => [p.id, p]))
  }, [projects])

  const selectedProject =
    projects.find((p) => p.id === selectedProjectId) ?? null

  const assigneeFilter =
    assigneeFilterId != null ? assigneeById.get(assigneeFilterId) ?? null : null

  const defaultAssigneeForNewTask = useMemo(() => {
    if (assigneeFilterId) return assigneeFilterId
    if (myAssigneeId) return myAssigneeId
    return null
  }, [assigneeFilterId, myAssigneeId])

  const openNewTaskModal = useCallback(() => {
    if (!(selectedProjectId ?? projects[0]?.id)) return
    setNewTaskOpen(true)
  }, [projects, selectedProjectId])

  const addTask = useCallback(
    async (
      title: string,
      assigneeId: string | null,
      status: TaskStatus = 'todo',
      openCompose = true,
    ) => {
      const projectId = selectedProjectId ?? projects[0]?.id
      if (!projectId || !title.trim() || !assigneeId) return
      const task = await createTask({
        projectId,
        title: title.trim(),
        taskDescription: '',
        status,
        deadline: null,
        notificationEnabled: true,
        assigneeId,
      })
      setNewTaskOpen(false)
      setSelectedTaskId(task.id)
      setComposeTaskId(openCompose ? task.id : null)
    },
    [projects, selectedProjectId, createTask],
  )

  const resetListFilters = useCallback(() => {
    setSidebarFilter('all')
    setSearchText('')
  }, [])

  const browseCompany = useCallback(() => {
    setBrowseMode('company')
    resetListFilters()
    setSelectedTaskId(null)
  }, [resetListFilters])

  const browseProject = useCallback(
    (id: string) => {
      setBrowseMode('project')
      setSelectedProjectId(id)
      resetListFilters()
      setSelectedTaskId(null)
    },
    [resetListFilters],
  )

  const browseAdmin = useCallback(() => {
    if (!isAdmin) return
    setBrowseMode('admin')
    resetListFilters()
    setSelectedTaskId(null)
  }, [isAdmin, resetListFilters])

  const returnToTasks = useCallback(() => {
    if (selectedProjectId) browseProject(selectedProjectId)
    else if (projects[0]) browseProject(projects[0].id)
    else browseCompany()
  }, [selectedProjectId, projects, browseProject, browseCompany])

  const setAssigneeFilter = useCallback((id: string | null) => {
    setAssigneeFilterId(id)
    if (id && browseMode === 'company') {
      setBrowseMode('assignee')
    }
    resetListFilters()
    setSelectedTaskId(null)
  }, [browseMode, resetListFilters])

  const myTasks = useCallback(() => {
    if (!myAssigneeId) return
    setAssigneeFilterId(myAssigneeId)
    setBrowseMode('assignee')
    resetListFilters()
    setSelectedTaskId(null)
  }, [myAssigneeId, resetListFilters])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        openNewTaskModal()
      }
      if (e.key === 'Escape' && selectedTaskId) {
        setSelectedTaskId(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openNewTaskModal, selectedTaskId])

  if (authLoading || !user) {
    if (!authLoading && !user) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="text-sm font-medium app-text">Could not start workspace</p>
          <p className="text-sm app-text-muted">
            Check{' '}
            <code className="text-xs">/api/health</code> and{' '}
            <code className="text-xs">/api/auth/session</code>. On the server, fix{' '}
            <code className="text-xs">api/config.php</code> (MySQL user/password), import{' '}
            <code className="text-xs">schema.sql</code>, then open{' '}
            <code className="text-xs">/api/seed.php</code> once.
          </p>
        </div>
      )
    }
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm app-text-muted">
        Loading workspace…
      </div>
    )
  }

  if (dataLoading && projects.length === 0) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm app-text-muted">
        Loading workspace…
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {error && (
        <div className="border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-center text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <AppHeader
        projects={projects}
        assignees={assignees}
        browseMode={browseMode}
        selectedProjectId={selectedProjectId}
        assigneeFilterId={assigneeFilterId}
        myAssigneeId={myAssigneeId}
        searchText={searchText}
        openByProject={openByProject}
        isAdmin={isAdmin}
        onProjectChange={(id) => {
          if (id) browseProject(id)
          else browseCompany()
        }}
        onAssigneeChange={setAssigneeFilter}
        onMyTasks={myTasks}
        onInsights={browseAdmin}
        onTasksView={returnToTasks}
        onSearchChange={setSearchText}
        onNewTask={openNewTaskModal}
        onManageTeam={() => setAssigneesOpen(true)}
        onManageProjects={() => setProjectsManageOpen(true)}
        onEditProject={(project) => {
          setEditingProject(project)
          setProjectModalOpen(true)
        }}
        onDeleteProject={(project) => setDeleteProjectTarget(project)}
      />

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {browseMode === 'admin' ? (
          <AdminDashboard />
        ) : (
          <div className="flex h-full min-h-0 flex-1 overflow-hidden">
            <div
              className={cn(
                'flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:max-w-[58%]',
                selectedTaskId && 'hidden lg:flex',
              )}
            >
              <TaskListPanel
                browseMode={browseMode}
                project={selectedProject}
                projectsById={projectsById}
                assigneeFilter={assigneeFilter}
                tasks={tasks}
                assigneeById={assigneeById}
                attachmentCounts={attachmentCounts}
                selectedTaskId={selectedTaskId}
                sidebarFilter={sidebarFilter}
                searchText={searchText}
                onFilterChange={setSidebarFilter}
                onSelectTask={(id) => {
                  setSelectedTaskId(id)
                  setComposeTaskId(null)
                }}
                onNewTask={openNewTaskModal}
                onQuickAdd={(title) => {
                  const assignee = assigneeFilterId ?? myAssigneeId
                  if (assignee) void addTask(title, assignee, 'todo', true)
                  else openNewTaskModal()
                }}
              />
            </div>

            <aside
              className={cn(
                'flex h-full min-h-0 flex-col overflow-hidden border-l app-border bg-[var(--color-surface-raised)]',
                'lg:relative lg:flex lg:min-w-[min(100%,520px)] lg:w-[min(720px,46vw)] lg:shrink-0 lg:flex-1',
                selectedTaskId
                  ? 'fixed inset-0 z-40 flex lg:static'
                  : 'hidden lg:flex',
              )}
            >
              <TaskDetailPanel
                taskId={selectedTaskId}
                project={
                  selectedTaskId
                    ? projectsById.get(
                        tasks.find((t) => t.id === selectedTaskId)?.projectId ?? '',
                      ) ?? selectedProject
                    : selectedProject
                }
                assignees={assignees}
                composeTaskId={composeTaskId}
                onComposeDismiss={() => setComposeTaskId(null)}
                onManageAssignees={() => setAssigneesOpen(true)}
                onClose={() => setSelectedTaskId(null)}
                onDeleted={() => {
                  setSelectedTaskId(null)
                  setComposeTaskId(null)
                }}
              />
            </aside>
          </div>
        )}
      </main>

      <NewTaskModal
        open={newTaskOpen}
        assignees={assignees}
        defaultAssigneeId={defaultAssigneeForNewTask}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onClose={() => setNewTaskOpen(false)}
        onManageTeam={() => {
          setNewTaskOpen(false)
          setAssigneesOpen(true)
        }}
        onCreate={(title, assigneeId, status, projectId) =>
          void (async () => {
            const pid = projectId ?? selectedProjectId ?? projects[0]?.id
            if (!pid || !assigneeId) return
            setSelectedProjectId(pid)
            setBrowseMode('project')
            const task = await createTask({
              projectId: pid,
              title: title.trim(),
              taskDescription: '',
              status,
              deadline: null,
              notificationEnabled: true,
              assigneeId,
            })
            setNewTaskOpen(false)
            setSelectedTaskId(task.id)
            setComposeTaskId(task.id)
          })()
        }
      />

      <AssigneesModal open={assigneesOpen} onClose={() => setAssigneesOpen(false)} />

      <ProjectsManageModal
        open={projectsManageOpen}
        openTaskCountByProject={openByProject}
        onClose={() => setProjectsManageOpen(false)}
        onCreate={() => {
          setEditingProject(null)
          setProjectModalOpen(true)
        }}
        onEdit={(project) => {
          setEditingProject(project)
          setProjectModalOpen(true)
        }}
        onDeleted={(id) => {
          if (selectedProjectId === id) {
            setSelectedTaskId(null)
            setBrowseMode('project')
          }
        }}
      />

      <ProjectModal
        open={projectModalOpen}
        editing={editingProject}
        onClose={() => {
          setProjectModalOpen(false)
          setEditingProject(null)
        }}
        onSave={(name, colorIndex) => {
          void (async () => {
            const project = await saveProject({
              id: editingProject?.id,
              name,
              colorIndex,
            })
            setProjectModalOpen(false)
            setEditingProject(null)
            browseProject(project.id)
          })()
        }}
      />

      {deleteProjectTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ background: 'var(--color-backdrop)' }}
        >
          <div className="max-w-sm rounded-2xl border p-6 app-border bg-[var(--color-surface-overlay)]">
            <h3 className="text-lg font-bold app-text">Delete project?</h3>
            <p className="mt-2 text-sm app-text-muted">
              “{deleteProjectTarget.name}” and all of its tasks will be permanently removed.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <GhostButton onClick={() => setDeleteProjectTarget(null)}>Cancel</GhostButton>
              <button
                type="button"
                className="rounded-lg bg-red-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                onClick={() =>
                  void (async () => {
                    const id = deleteProjectTarget.id
                    for (const t of tasks.filter((t) => t.projectId === id)) {
                      cancelNotification(t.id)
                    }
                    await deleteProject(id)
                    if (selectedProjectId === id) {
                      setSelectedTaskId(null)
                    }
                    setDeleteProjectTarget(null)
                  })()
                }
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
