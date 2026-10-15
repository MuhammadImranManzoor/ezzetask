import { User, X } from 'lucide-react'
import { assigneeColor } from '../lib/assigneeColors'
import type { Assignee, BrowseMode } from '../types'
import { cn } from './ui'

type Props = {
  browseMode: BrowseMode
  assignees: Assignee[]
  assigneeFilterId: string | null
  assigneeFilter: Assignee | null
  taskCount: number
  onSelectAssignee: (id: string | null) => void
  onShowAllTeam: () => void
  onShowProjectsHint?: () => void
}

export function AssigneeFilterBar({
  browseMode,
  assignees,
  assigneeFilterId,
  assigneeFilter,
  taskCount,
  onSelectAssignee,
  onShowAllTeam,
}: Props) {
  const sorted = [...assignees].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="rounded-xl border app-border app-bg-subtle p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide app-text-muted">
          <User className="h-3.5 w-3.5" />
          Filter by assignee
        </span>
        {browseMode === 'assignee' && assigneeFilterId && (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-medium app-text-muted hover:app-text"
            onClick={() => {
              onSelectAssignee(null)
              onShowAllTeam()
            }}
          >
            Clear
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <select
        value={assigneeFilterId ?? ''}
        onChange={(e) => {
          const id = e.target.value || null
          onSelectAssignee(id)
        }}
        className="app-input mb-2 w-full cursor-pointer py-2 text-sm"
        aria-label="Filter tasks by team member"
      >
        <option value="">Everyone (no assignee filter)</option>
        {sorted.map((person) => (
          <option key={person.id} value={person.id}>
            {person.name}
          </option>
        ))}
      </select>

      {browseMode === 'assignee' && assigneeFilter ? (
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg border px-3 py-2 app-border',
            'bg-[var(--color-surface)]',
          )}
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ backgroundColor: assigneeColor(assigneeFilter.colorIndex) }}
          >
            {assigneeFilter.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold app-text">
              Showing {assigneeFilter.name}&apos;s tasks
            </p>
            <p className="text-xs app-text-muted">
              {taskCount} task{taskCount === 1 ? '' : 's'} across all projects
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs leading-relaxed app-text-muted">
          Pick a name (e.g. Bilal) to see only tasks assigned to them. Or click a name under{' '}
          <strong className="font-medium app-text">Team</strong> in the sidebar.
        </p>
      )}
    </div>
  )
}
