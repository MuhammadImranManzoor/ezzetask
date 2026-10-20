import { UserPlus } from 'lucide-react'
import type { Assignee } from '../types'
import { assigneeColor } from '../lib/assigneeColors'
import { cn, GhostButton } from './ui'

type Props = {
  assignees: Assignee[]
  value: string | null
  onChange: (assigneeId: string | null) => void
  onManageTeam: () => void
  className?: string
  spacious?: boolean
  allowUnassigned?: boolean
}

export function AssigneeSelect({
  assignees,
  value,
  onChange,
  onManageTeam,
  className,
  spacious = false,
  allowUnassigned = true,
}: Props) {
  const sorted = [...assignees].sort((a, b) => a.name.localeCompare(b.name))
  const selected = value ? assignees.find((a) => a.id === value) : null

  return (
    <div className={className}>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className={cn(
          'app-input w-full cursor-pointer',
          spacious && 'py-3 text-base',
        )}
      >
        {allowUnassigned ? (
          <option value="">Unassigned</option>
        ) : (
          <option value="" disabled>
            Select assignee
          </option>
        )}
        {sorted.map((person) => (
          <option key={person.id} value={person.id}>
            {person.name}
          </option>
        ))}
      </select>

      {selected && spacious && (
        <div className="mt-3 flex items-center gap-3 rounded-lg border px-3 py-2.5 app-border app-surface-raised">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: assigneeColor(selected.colorIndex) }}
          >
            {selected.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium app-text">{selected.name}</p>
            <p className="text-xs capitalize app-text-muted">{selected.team}</p>
          </div>
        </div>
      )}

      <GhostButton
        type="button"
        className={cn(
          'justify-start gap-2',
          spacious ? 'mt-4 w-full py-2.5 text-sm' : 'mt-3 w-full text-xs',
        )}
        onClick={onManageTeam}
      >
        <UserPlus className="h-4 w-4" />
        Add or manage assignees
      </GhostButton>

      {assignees.length === 0 && (
        <p className="mt-2 text-xs app-text-muted">
          Add team members first, then pick from the list to avoid typos.
        </p>
      )}
    </div>
  )
}
