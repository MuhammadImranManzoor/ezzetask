import {
  CheckCircle2,
  Circle,
  Clock,
  Image as ImageIcon,
  Loader2,
  Plus,
  Search,
  User,
  X,
} from 'lucide-react'
import { filterMatches, sortTasks } from '../lib/filters'
import { projectColor, SIDEBAR_FILTERS, TASK_STATUS_LABEL } from '../lib/constants'
import { isOverdue, isToday, relative } from '../lib/dateFormatting'
import { assigneeColor } from '../lib/assigneeColors'
import { buildAssigneeNameMap } from '../lib/assigneeMatch'
import { visibleTasks } from '../lib/taskViews'
import { AssigneeFilterBar } from './AssigneeFilterBar'
import { useMemo, type CSSProperties } from 'react'
import type {
  Assignee,
  BrowseMode,
  Project,
  SidebarFilterId,
  TaskItem,
  TaskStatus,
} from '../types'
import { TaskQuickAdd } from './TaskQuickAdd'
import { cn, EmptyState, PrimaryButton } from './ui'

function StatusChip({ status }: { status: TaskStatus }) {
  const styles: Record<TaskStatus, string> = {
    todo: 'app-status-todo',
    inProgress: 'app-status-progress',
    done: 'app-status-done',
  }
  return (
    <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-medium', styles[status])}>
      {TASK_STATUS_LABEL[status]}
    </span>
  )
}

function StatusIcon({ status }: { status: TaskStatus }) {
  const config: Record<TaskStatus, { Icon: typeof Circle; chip: string }> = {
    todo: { Icon: Circle, chip: 'app-status-todo' },
    inProgress: { Icon: Loader2, chip: 'app-status-progress' },
    done: { Icon: CheckCircle2, chip: 'app-status-done' },
  }
  const { Icon, chip } = config[status]
  return (
    <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', chip)}>
      <Icon className="h-3.5 w-3.5" />
    </span>
  )
}

type Props = {
  browseMode: BrowseMode
  project: Project | null
  projectsById: Map<string, Project>
  assigneeFilter: Assignee | null
  tasks: TaskItem[]
  assigneeById: Map<string, Assignee>
  attachmentCounts: Map<string, number>
  selectedTaskId: string | null
  sidebarFilter: SidebarFilterId
  searchText: string
  onSearchChange: (value: string) => void
  onFilterChange: (filter: SidebarFilterId) => void
  onSelectTask: (id: string) => void
  onNewTask: () => void
  onQuickAdd: (title: string) => void
  onAssigneeFilterChange: (assigneeId: string | null) => void
  onShowAllTeam: () => void
}

export function TaskListPanel({
  browseMode,
  project,
  projectsById,
  assigneeFilter,
  tasks,
  assigneeById,
  attachmentCounts,
  selectedTaskId,
  sidebarFilter,
  searchText,
  onSearchChange,
  onFilterChange,
  onSelectTask,
  onNewTask,
  onQuickAdd,
  onAssigneeFilterChange,
  onShowAllTeam,
}: Props) {
  const nameToId = useMemo(() => buildAssigneeNameMap([...assigneeById.values()]), [assigneeById])

  const scopeTasks = visibleTasks(
    tasks,
    browseMode,
    project?.id ?? null,
    assigneeFilter?.id ?? null,
    nameToId,
  )

  const showProjectOnRow = browseMode !== 'project' || assigneeFilter != null

  const filtered = scopeTasks
    .filter((t) => {
      if (searchText.trim()) {
        const q = searchText.toLowerCase()
        const assigneeName =
          t.assigneeId != null ? (assigneeById.get(t.assigneeId)?.name ?? '') : ''
        const projectName = projectsById.get(t.projectId)?.name ?? ''
        if (
          !t.title.toLowerCase().includes(q) &&
          !t.taskDescription.toLowerCase().includes(q) &&
          !assigneeName.toLowerCase().includes(q) &&
          !projectName.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      return filterMatches(sidebarFilter, t)
    })
    .sort(sortTasks)

  const canAddTask = browseMode === 'project' ? Boolean(project) : projectsById.size > 0

  const headerTitle =
    assigneeFilter != null
      ? `${assigneeFilter.name}'s tasks`
      : browseMode === 'company'
        ? 'All team tasks'
        : project?.name ?? 'Tasks'

  const headerSubtitle =
    assigneeFilter != null && browseMode === 'project' && project
      ? `Assigned to ${assigneeFilter.name} · ${project.name} only`
      : assigneeFilter != null
        ? 'All projects · use status chips below'
        : browseMode === 'company'
          ? 'Everyone · pick a name to filter by assignee'
          : project
            ? 'This project · use assignee filter to narrow further'
            : 'Select a project'

  const emptyDescription =
    assigneeFilter != null
      ? sidebarFilter !== 'all'
        ? `No “${SIDEBAR_FILTERS.find((f) => f.id === sidebarFilter)?.title}” tasks for ${assigneeFilter.name}. Try the All chip above.`
        : `No tasks linked to ${assigneeFilter.name}. Use Assign task and pick them as assignee, or check task details.`
      : browseMode === 'company'
        ? 'No tasks yet. Use Assign task and pick a team member.'
        : 'Use Assign task to add work and pick a team member.'

  return (
    <section className="app-list-panel flex h-full min-w-0 flex-col border-r app-border bg-[var(--color-surface)]">
      <header className="flex items-start justify-between gap-3 border-b app-border px-5 py-4">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold app-text">{headerTitle}</h1>
          <p className="mt-0.5 text-xs app-text-muted">{headerSubtitle}</p>
        </div>
        <PrimaryButton
          className="shrink-0 px-3 py-1.5 text-xs"
          disabled={!canAddTask}
          onClick={onNewTask}
        >
          <Plus className="h-4 w-4" />
          Assign task
        </PrimaryButton>
      </header>

      <div className="space-y-3 border-b app-border px-4 py-4">
        <AssigneeFilterBar
          browseMode={browseMode}
          assignees={[...assigneeById.values()]}
          assigneeFilterId={assigneeFilter?.id ?? null}
          assigneeFilter={assigneeFilter}
          taskCount={scopeTasks.length}
          onSelectAssignee={(id) => {
            onAssigneeFilterChange(id)
          }}
          onShowAllTeam={onShowAllTeam}
        />

        {browseMode === 'project' && (
          <TaskQuickAdd
            disabled={!canAddTask}
            onAdd={onQuickAdd}
            onOpenFullForm={onNewTask}
          />
        )}

        <div className="flex items-center gap-2 rounded-lg app-bg-subtle px-3 py-2 ring-1 app-border focus-within:app-accent-ring">
          <Search className="h-4 w-4 shrink-0 app-text-muted" />
          <input
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              browseMode === 'assignee' ? 'Search this person’s tasks' : 'Search tasks'
            }
            className="min-w-0 flex-1 bg-transparent text-sm app-text outline-none placeholder:app-text-faint"
          />
          {searchText && (
            <button
              type="button"
              className="app-text-muted hover:text-[var(--color-text)]"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
          {SIDEBAR_FILTERS.map(({ id, title }) => (
            <button
              key={id}
              type="button"
              onClick={() => onFilterChange(id)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition',
                sidebarFilter === id
                  ? 'app-accent-soft app-accent-ring app-filter-active'
                  : 'app-bg-subtle app-text-muted app-bg-hover hover:text-[var(--color-text)]',
              )}
            >
              {title}
            </button>
          ))}
        </div>

        <div className="flex justify-between text-xs app-text-muted">
          <span>
            {filtered.length} task{filtered.length === 1 ? '' : 's'}
          </span>
          <span>{SIDEBAR_FILTERS.find((f) => f.id === sidebarFilter)?.title}</span>
        </div>
      </div>

      {!canAddTask && browseMode === 'project' ? (
        <EmptyState
          icon={<Circle className="h-6 w-6" />}
          title="No project selected"
          description="Pick a project in the sidebar, or open a team member to see their assignments."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-6 w-6" />}
          title="No tasks here"
          description={emptyDescription}
          action={
            <PrimaryButton onClick={onNewTask} disabled={!canAddTask}>
              <Plus className="h-4 w-4" />
              Assign task
            </PrimaryButton>
          }
        />
      ) : (
        <ul className="scrollbar-thin flex-1 overflow-y-auto p-2">
          {filtered.map((task) => {
            const selected = selectedTaskId === task.id
            const attachments = attachmentCounts.get(task.id) ?? 0
            const taskProject = projectsById.get(task.projectId)
            let deadlineStyle: CSSProperties | undefined
            if (task.deadline && task.status !== 'done') {
              const d = new Date(task.deadline)
              if (isOverdue(d)) deadlineStyle = { color: 'var(--status-overdue)' }
              else if (isToday(d)) deadlineStyle = { color: 'var(--status-today)' }
            }
            return (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => onSelectTask(task.id)}
                  className={cn(
                    'mb-1 flex w-full gap-3 rounded-xl px-3 py-3 text-left transition',
                    selected ? 'app-accent-soft app-accent-ring' : 'app-bg-hover',
                  )}
                >
                  <StatusIcon status={task.status} />
                  <div className="min-w-0 flex-1">
                    {showProjectOnRow && taskProject && (
                      <p
                        className="mb-1 truncate text-[11px] font-medium"
                        style={{ color: projectColor(taskProject.colorIndex) }}
                      >
                        {taskProject.name}
                      </p>
                    )}
                    <div className="flex items-start gap-2">
                      <p className="line-clamp-2 flex-1 text-sm font-medium app-text">
                        {task.title.trim() || 'Untitled task'}
                      </p>
                      {attachments > 0 && (
                        <ImageIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 app-text-muted" />
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <StatusChip status={task.status} />
                      {browseMode !== 'assignee' &&
                        task.assigneeId &&
                        assigneeById.get(task.assigneeId) && (
                          <span className="app-assignee-badge">
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{
                                backgroundColor: assigneeColor(
                                  assigneeById.get(task.assigneeId)!.colorIndex,
                                ),
                              }}
                            />
                            <User className="h-3 w-3 opacity-60" />
                            {assigneeById.get(task.assigneeId)!.name}
                          </span>
                        )}
                      {!task.assigneeId && browseMode === 'company' && (
                        <span className="text-[11px] app-text-faint">Unassigned</span>
                      )}
                      {task.deadline && (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] app-text-muted"
                          style={deadlineStyle}
                        >
                          <Clock className="h-3 w-3" />
                          {relative(new Date(task.deadline))}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
