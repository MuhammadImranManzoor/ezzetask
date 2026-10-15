import { useLiveQuery } from 'dexie-react-hooks'
import { Menu } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AssigneesModal } from './components/AssigneesModal'
import { NewTaskModal } from './components/NewTaskModal'
import { Sidebar } from './components/Sidebar'
import { TaskDetailPanel } from './components/TaskDetailPanel'
import { TaskListPanel } from './components/TaskListPanel'
import { GhostButton } from './components/ui'
import { db } from './db'
import { repairTaskAssigneeLinks } from './lib/assigneeRepair'
import { ensureSeedData, getFirstProjectId } from './lib/migration'
import { resyncAllNotifications } from './services/notifications'
import { getMyAssigneeId, setMyAssigneeId } from './lib/workspace'
import { APP_NAME } from './lib/constants'
import type { BrowseMode, SidebarFilterId, TaskStatus } from './types'

export default function App() {
  const [ready, setReady] = useState(false)
  const [browseMode, setBrowseMode] = useState<BrowseMode>('company')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [assigneeFilterId, setAssigneeFilterId] = useState<string | null>(null)
  const [myAssigneeId, setMyAssigneeIdState] = useState<string | null>(() =>
    getMyAssigneeId(),
  )
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [sidebarFilter, setSidebarFilter] = useState<SidebarFilterId>('all')
  const [searchText, setSearchText] = useState('')
  const [mobilePane, setMobilePane] = useState<'sidebar' | 'list' | 'detail'>('list')
  const [newTaskOpen, setNewTaskOpen] = useState(false)
  const [assigneesOpen, setAssigneesOpen] = useState(false)
  const [composeTaskId, setComposeTaskId] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      await ensureSeedData()
      await repairTaskAssigneeLinks()
      const first = await getFirstProjectId()
      setSelectedProjectId(first)
      setReady(true)
      await resyncAllNotifications()
    })()
  }, [])

  const projects = useLiveQuery(
    () => db.projects.orderBy('sortOrder').toArray(),
    [],
    [],
  )
  const tasks = useLiveQuery(() => db.tasks.toArray(), [], [])
  const attachments = useLiveQuery(() => db.attachments.toArray(), [], [])
  const assignees = useLiveQuery(
    () => db.assignees.orderBy('name').toArray(),
    [],
    [],
  )

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id)
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

  const tasksByProject = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of tasks) {
      if (t.status === 'done') continue
      map.set(t.projectId, (map.get(t.projectId) ?? 0) + 1)
    }
    return map
  }, [tasks])

  const attachmentCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const a of attachments) {
      map.set(a.taskId, (map.get(a.taskId) ?? 0) + 1)
    }
    return map
  }, [attachments])

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
    if (browseMode === 'assignee' && assigneeFilterId) return assigneeFilterId
    return null
  }, [browseMode, assigneeFilterId])

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
      const task = {
        id: crypto.randomUUID(),
        projectId,
        title: title.trim(),
        taskDescription: '',
        status,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deadline: null,
        notificationEnabled: true,
        assigneeId,
      }
      await db.tasks.add(task)
      setNewTaskOpen(false)
      setSelectedTaskId(task.id)
      setComposeTaskId(openCompose ? task.id : null)
      setMobilePane('detail')
    },
    [projects, selectedProjectId],
  )

  const resetListFilters = useCallback(() => {
    setSidebarFilter('all')
    setSearchText('')
  }, [])

  const browseCompany = useCallback(() => {
    setBrowseMode('company')
    setAssigneeFilterId(null)
    resetListFilters()
    setSelectedTaskId(null)
    setMobilePane('list')
  }, [resetListFilters])

  const browseAssignee = useCallback(
    (id: string) => {
      setBrowseMode('assignee')
      setAssigneeFilterId(id)
      resetListFilters()
      setSelectedTaskId(null)
      setMobilePane('list')
    },
    [resetListFilters],
  )

  const browseProject = useCallback(
    (id: string) => {
      setBrowseMode('project')
      setSelectedProjectId(id)
      resetListFilters()
      setSelectedTaskId(null)
      setMobilePane('list')
    },
    [resetListFilters],
  )

  const setAssigneeFilter = useCallback(
    (id: string | null) => {
      if (id) {
        setAssigneeFilterId(id)
        setBrowseMode((mode) => (mode === 'project' ? 'project' : 'assignee'))
      } else {
        setAssigneeFilterId(null)
        setBrowseMode((mode) => (mode === 'assignee' ? 'company' : mode))
      }
      resetListFilters()
      setSelectedTaskId(null)
      setMobilePane('list')
    },
    [resetListFilters],
  )

  const myTasks = useCallback(() => {
    if (!myAssigneeId) return
    browseAssignee(myAssigneeId)
  }, [myAssigneeId, browseAssignee])

  const onMyProfileChange = useCallback((id: string | null) => {
    setMyAssigneeId(id)
    setMyAssigneeIdState(id)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        openNewTaskModal()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openNewTaskModal])

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm app-text-muted">
        Loading…
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex items-center gap-2 border-b app-border bg-[var(--color-surface-raised)] px-3 py-2 lg:hidden">
        <GhostButton
          className="px-2"
          aria-label="Toggle sidebar"
          onClick={() => setMobilePane('sidebar')}
        >
          <Menu className="h-5 w-5" />
        </GhostButton>
        <span className="text-sm font-semibold app-text">{APP_NAME}</span>
        <div className="ml-auto flex gap-1">
          {(['list', 'detail'] as const).map((pane) => (
            <button
              key={pane}
              type="button"
              onClick={() => setMobilePane(pane)}
              className={
                mobilePane === pane
                  ? 'rounded-md px-2 py-1 text-xs app-text app-bg-subtle'
                  : 'rounded-md px-2 py-1 text-xs app-text-muted'
              }
            >
              {pane === 'list' ? 'Tasks' : 'Detail'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[280px_minmax(300px,380px)_1fr]">
        <div
          className={
            mobilePane === 'sidebar'
              ? 'fixed inset-0 z-40 lg:relative lg:block'
              : 'hidden lg:block'
          }
        >
          {mobilePane === 'sidebar' && (
            <button
              type="button"
              className="absolute inset-0 bg-black/50 lg:hidden"
              aria-label="Close sidebar"
              onClick={() => setMobilePane('list')}
            />
          )}
          <div className="relative z-10 h-full max-w-[300px] lg:max-w-none">
            <Sidebar
              projects={projects}
              assignees={assignees}
              tasks={tasks}
              tasksByProject={tasksByProject}
              browseMode={browseMode}
              selectedProjectId={selectedProjectId}
              assigneeFilterId={assigneeFilterId}
              myAssigneeId={myAssigneeId}
              onBrowseCompany={browseCompany}
              onBrowseAssignee={browseAssignee}
              onBrowseProject={browseProject}
              onMyTasks={myTasks}
              onMyProfileChange={onMyProfileChange}
              onProjectCreated={(id) => browseProject(id)}
              onManageTeam={() => setAssigneesOpen(true)}
            />
          </div>
        </div>

        <div className={mobilePane === 'list' ? 'flex min-h-0 flex-col' : 'hidden lg:flex lg:min-h-0 lg:flex-col'}>
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
            onSearchChange={setSearchText}
            onFilterChange={setSidebarFilter}
            onSelectTask={(id) => {
              setSelectedTaskId(id)
              setComposeTaskId(null)
              setMobilePane('detail')
            }}
            onNewTask={openNewTaskModal}
            onQuickAdd={(title) => {
              const assignee = assigneeFilterId ?? myAssigneeId
              if (assignee) void addTask(title, assignee, 'todo', true)
              else openNewTaskModal()
            }}
            onAssigneeFilterChange={setAssigneeFilter}
            onShowAllTeam={browseCompany}
          />
        </div>

        <div className={mobilePane === 'detail' ? 'flex min-h-0 flex-col' : 'hidden lg:flex lg:min-h-0 lg:flex-col'}>
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
            onDeleted={() => {
              setSelectedTaskId(null)
              setComposeTaskId(null)
            }}
          />
        </div>
      </div>

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
            const task = {
              id: crypto.randomUUID(),
              projectId: pid,
              title: title.trim(),
              taskDescription: '',
              status,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              deadline: null,
              notificationEnabled: true,
              assigneeId,
            }
            await db.tasks.add(task)
            setNewTaskOpen(false)
            setSelectedTaskId(task.id)
            setComposeTaskId(task.id)
            setMobilePane('detail')
          })()
        }
      />

      <AssigneesModal open={assigneesOpen} onClose={() => setAssigneesOpen(false)} />
    </div>
  )
}
