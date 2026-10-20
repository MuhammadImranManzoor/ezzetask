import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AdminDashboard } from './components/AdminDashboard'
import { AppHeader } from './components/AppHeader'
import { AssigneesModal } from './components/AssigneesModal'
import { NewTaskModal } from './components/NewTaskModal'
import { ProjectModal } from './components/ProjectModal'
import { ProjectsManageModal } from './components/ProjectsManageModal'
import { TaskDetailPanel } from './components/TaskDetailPanel'
import { TaskListPanel } from './components/TaskListPanel'
import { cn, GhostButton } from './components/ui'
import { ApiError } from './api/client'
import { useAuth } from './context/AuthContext'
import { useData } from './context/DataContext'
import { useToast } from './context/ToastContext'
import { useTaskEdit } from './context/TaskEditContext'
import { useAttachmentCounts } from './hooks/useAttachmentCounts'
import {
  cancelNotification,
  resyncAllNotifications,
} from './services/notifications'
import type { BrowseMode, Project, SidebarFilterId } from './types'

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
  const { pushToast } = useToast()
  const { state: editState, discardEdits } = useTaskEdit()
  const { counts: attachmentCounts, reload: reloadAttachmentCounts } =
    useAttachmentCounts()

  const myAssigneeId = user?.memberId ?? null

  const taskErrorMessage = (e: unknown) =>
    e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Could not save task'

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

  const [discardPrompt, setDiscardPrompt] = useState<
    { kind: 'task'; nextTaskId: string } | { kind: 'close' } | null
  >(null)

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

  const resetListFilters = useCallback(() => {
    setSidebarFilter('all')
    setSearchText('')
  }, [])

  const pendingLeaveRef = useRef<(() => void) | null>(null)

  const leaveTaskIfNeeded = useCallback(
    (action: () => void) => {
      if (editState.isDirty && selectedTaskId) {
        setDiscardPrompt({ kind: 'close' })
        pendingLeaveRef.current = action
        return
      }
      action()
    },
    [editState.isDirty, selectedTaskId],
  )

  const selectTask = useCallback(
    (id: string) => {
      if (id === selectedTaskId) return
      if (editState.isDirty && selectedTaskId) {
        setDiscardPrompt({ kind: 'task', nextTaskId: id })
        return
      }
      setSelectedTaskId(id)
      setComposeTaskId(null)
    },
    [editState.isDirty, selectedTaskId],
  )

  const closeTaskPanel = useCallback(() => {
    if (editState.isDirty && selectedTaskId) {
      setDiscardPrompt({ kind: 'close' })
      return
    }
    setSelectedTaskId(null)
  }, [editState.isDirty, selectedTaskId])

  const confirmDiscardEdits = useCallback(() => {
    discardEdits()
    const pending = pendingLeaveRef.current
    pendingLeaveRef.current = null
    if (discardPrompt?.kind === 'task') {
      setSelectedTaskId(discardPrompt.nextTaskId)
      setComposeTaskId(null)
    } else if (discardPrompt?.kind === 'close') {
      if (pending) pending()
      else setSelectedTaskId(null)
    }
    setDiscardPrompt(null)
  }, [discardEdits, discardPrompt])

  const browseCompany = useCallback(() => {
    leaveTaskIfNeeded(() => {
      setBrowseMode('company')
      resetListFilters()
      setSelectedTaskId(null)
    })
  }, [leaveTaskIfNeeded, resetListFilters])

  const browseProject = useCallback(
    (id: string) => {
      leaveTaskIfNeeded(() => {
        setBrowseMode('project')
        setSelectedProjectId(id)
        resetListFilters()
        setSelectedTaskId(null)
      })
    },
    [leaveTaskIfNeeded, resetListFilters],
  )

  const browseAdmin = useCallback(() => {
    if (!isAdmin) return
    leaveTaskIfNeeded(() => {
      setBrowseMode('admin')
      resetListFilters()
      setSelectedTaskId(null)
    })
  }, [isAdmin, leaveTaskIfNeeded, resetListFilters])

  const returnToTasks = useCallback(() => {
    if (selectedProjectId) browseProject(selectedProjectId)
    else if (projects[0]) browseProject(projects[0].id)
    else browseCompany()
  }, [selectedProjectId, projects, browseProject, browseCompany])

  const setAssigneeFilter = useCallback(
    (id: string | null) => {
      leaveTaskIfNeeded(() => {
        setAssigneeFilterId(id)
        if (id && browseMode === 'company') {
          setBrowseMode('assignee')
        }
        resetListFilters()
        setSelectedTaskId(null)
      })
    },
    [browseMode, leaveTaskIfNeeded, resetListFilters],
  )

  const myTasks = useCallback(() => {
    if (!myAssigneeId) return
    leaveTaskIfNeeded(() => {
      setAssigneeFilterId(myAssigneeId)
      setBrowseMode('assignee')
      resetListFilters()
      setSelectedTaskId(null)
    })
  }, [myAssigneeId, leaveTaskIfNeeded, resetListFilters])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        openNewTaskModal()
      }
      if (e.key === 'Escape' && selectedTaskId && !discardPrompt) {
        closeTaskPanel()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openNewTaskModal, selectedTaskId, discardPrompt, closeTaskPanel])

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
    <div className="flex h-dvh flex-col overflow-hidden" data-testid="workspace">
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
                onSelectTask={selectTask}
                onNewTask={openNewTaskModal}
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
                onClose={closeTaskPanel}
                onDeleted={() => {
                  setSelectedTaskId(null)
                  setComposeTaskId(null)
                  void reloadAttachmentCounts()
                }}
                onAttachmentsChanged={() => void reloadAttachmentCounts()}
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
            if (!pid || !assigneeId) {
              pushToast('Project and assignee are required.', 'info')
              return
            }
            try {
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
            } catch (e) {
              pushToast(taskErrorMessage(e))
            }
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

      {discardPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ background: 'var(--color-backdrop)' }}
        >
          <div className="max-w-sm rounded-2xl border p-6 app-border bg-[var(--color-surface-overlay)]">
            <h3 className="text-lg font-bold app-text">Discard unsaved changes?</h3>
            <p className="mt-2 text-sm app-text-muted">
              Your edits to this task have not been saved. You can go back and click Save, or
              discard them.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <GhostButton
                onClick={() => {
                  pendingLeaveRef.current = null
                  setDiscardPrompt(null)
                }}
              >
                Keep editing
              </GhostButton>
              <button
                type="button"
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                onClick={() => confirmDiscardEdits()}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

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
