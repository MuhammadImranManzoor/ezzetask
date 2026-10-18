import {
  CheckCircle2,
  Circle,
  Clock,
  Image as ImageIcon,
  Loader2,
  Plus,
} from 'lucide-react'
import { filterMatches, sortTasks } from '../lib/filters'
import { SIDEBAR_FILTERS, TASK_STATUS_LABEL } from '../lib/constants'
import { isOverdue, isToday, relative } from '../lib/dateFormatting'
import { assigneeColor } from '../lib/assigneeColors'
import { buildAssigneeNameMap } from '../lib/assigneeMatch'
import { visibleTasks } from '../lib/taskViews'
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
  onFilterChange: (filter: SidebarFilterId) => void
  onSelectTask: (id: string) => void
  onNewTask: () => void
  onQuickAdd: (title: string) => void
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
  onFilterChange,
  onSelectTask,
  onNewTask,
  onQuickAdd,
}: Props) {
  const nameToId = useMemo(() => buildAssigneeNameMap([...assigneeById.values()]), [assigneeById])

  const scopeTasks = visibleTasks(
    tasks,
    browseMode,
    project?.id ?? null,
    assigneeFilter?.id ?? null,
    nameToId,
  )

  const showProjectColumn = browseMode !== 'project'

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

  const counts = useMemo(() => {
    let open = 0
    let done = 0
    for (const t of scopeTasks) {
      if (t.status === 'done') done++
      else open++
    }
    return { open, done, total: scopeTasks.length }
  }, [scopeTasks])

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden app-workspace-canvas">
      <div className="shrink-0 flex flex-wrap items-end justify-between gap-3 px-4 py-4 lg:px-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight app-text">
            {assigneeFilter
              ? assigneeFilter.name
              : browseMode === 'company'
                ? 'All projects'
                : (project?.name ?? 'Tasks')}
          </h1>
          <p className="mt-1 text-sm app-text-muted">
            {counts.open} open · {counts.done} done · {filtered.length} shown
          </p>
        </div>
        <div className="scrollbar-thin flex max-w-full gap-1.5 overflow-x-auto pb-0.5">
          {SIDEBAR_FILTERS.map(({ id, title }) => (
            <button
              key={id}
              type="button"
              onClick={() => onFilterChange(id)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition',
                sidebarFilter === id
                  ? 'app-chip-active'
                  : 'app-chip app-bg-hover',
              )}
            >
              {title}
            </button>
          ))}
        </div>
      </div>

      {browseMode === 'project' && project && (
        <div className="shrink-0 px-4 pb-3 lg:px-8">
          <TaskQuickAdd
            disabled={!canAddTask}
            onAdd={onQuickAdd}
            onOpenFullForm={onNewTask}
          />
        </div>
      )}

      {!canAddTask && browseMode === 'project' ? (
        <div className="flex min-h-0 flex-1 overflow-y-auto">
          <EmptyState
            icon={<Circle className="h-6 w-6" />}
            title="Choose a project"
            description="Use the project menu at the top to open a project workspace."
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-0 flex-1 overflow-y-auto">
          <EmptyState
            icon={<CheckCircle2 className="h-6 w-6" />}
            title="No tasks match"
            description="Create a task or relax filters to see more work items."
            action={
              <PrimaryButton onClick={onNewTask} disabled={!canAddTask}>
                <Plus className="h-4 w-4" />
                New task
              </PrimaryButton>
            }
          />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pb-4 lg:px-6">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border app-border app-surface-raised">
            <div
              className={cn(
                'hidden shrink-0 border-b px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide app-border app-text-muted md:grid',
                showProjectColumn
                  ? 'grid-cols-[minmax(0,1fr)_120px_130px_100px_88px]'
                  : 'grid-cols-[minmax(0,1fr)_130px_100px_88px]',
              )}
            >
              <span>Task</span>
              {showProjectColumn && <span>Project</span>}
              <span>Assignee</span>
              <span>Status</span>
              <span>Due</span>
            </div>
            <ul className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
              {filtered.map((task) => {
                const selected = selectedTaskId === task.id
                const attachments = attachmentCounts.get(task.id) ?? 0
                const taskProject = projectsById.get(task.projectId)
                const assignee =
                  task.assigneeId != null
                    ? assigneeById.get(task.assigneeId)
                    : undefined
                let deadlineStyle: CSSProperties | undefined
                if (task.deadline && task.status !== 'done') {
                  const d = new Date(task.deadline)
                  if (isOverdue(d)) deadlineStyle = { color: 'var(--status-overdue)' }
                  else if (isToday(d)) deadlineStyle = { color: 'var(--status-today)' }
                }
                return (
                  <li key={task.id} className="border-b last:border-b-0 app-border">
                    <button
                      type="button"
                      onClick={() => onSelectTask(task.id)}
                      className={cn(
                        'flex w-full gap-3 px-4 py-3 text-left transition md:grid md:items-center md:gap-4',
                        showProjectColumn
                          ? 'md:grid-cols-[minmax(0,1fr)_120px_130px_100px_88px]'
                          : 'md:grid-cols-[minmax(0,1fr)_130px_100px_88px]',
                        selected ? 'app-row-selected' : 'app-bg-hover',
                      )}
                    >
                      <div className="flex min-w-0 items-start gap-3 md:contents">
                        <StatusDot status={task.status} />
                        <div className="min-w-0 flex-1 md:col-start-1">
                          <p className="truncate text-sm font-medium app-text">
                            {task.title.trim() || 'Untitled task'}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 md:hidden">
                            <StatusChip status={task.status} />
                            {assignee && (
                              <span className="text-xs app-text-muted">{assignee.name}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {showProjectColumn && (
                        <span className="hidden truncate text-xs font-medium md:block app-text-muted">
                          {taskProject?.name ?? '—'}
                        </span>
                      )}

                      <span className="hidden items-center gap-2 truncate text-xs md:flex app-text">
                        {assignee ? (
                          <>
                            <span
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white"
                              style={{
                                backgroundColor: assigneeColor(assignee.colorIndex),
                              }}
                            >
                              {assignee.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="truncate">{assignee.name}</span>
                          </>
                        ) : (
                          <span className="app-text-faint">Unassigned</span>
                        )}
                      </span>

                      <span className="hidden md:block">
                        <StatusChip status={task.status} />
                      </span>

                      <span
                        className="hidden items-center gap-1 text-xs tabular-nums md:flex app-text-muted"
                        style={deadlineStyle}
                      >
                        {task.deadline ? (
                          <>
                            <Clock className="h-3 w-3 shrink-0" />
                            {relative(new Date(task.deadline))}
                          </>
                        ) : (
                          '—'
                        )}
                        {attachments > 0 && (
                          <ImageIcon className="ml-1 h-3.5 w-3.5 opacity-60" />
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}

function StatusDot({ status }: { status: TaskStatus }) {
  const config: Record<TaskStatus, { Icon: typeof Circle; className: string }> = {
    todo: { Icon: Circle, className: 'text-[var(--status-todo-icon)]' },
    inProgress: { Icon: Loader2, className: 'text-[var(--status-progress-icon)]' },
    done: { Icon: CheckCircle2, className: 'text-[var(--status-done-icon)]' },
  }
  const { Icon, className } = config[status]
  return (
    <span className={cn('mt-0.5 shrink-0 md:mt-0', className)}>
      <Icon className="h-4 w-4" />
    </span>
  )
}
