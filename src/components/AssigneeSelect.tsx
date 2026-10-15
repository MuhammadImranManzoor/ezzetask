import { UserPlus } from 'lucide-react'
import type { Assignee } from '../types'
import { assigneeColor } from '../lib/assigneeColors'
import { GhostButton } from './ui'

type Props = {
  assignees: Assignee[]
  value: string | null
  onChange: (assigneeId: string | null) => void
  onManageTeam: () => void
  className?: string
}

export function AssigneeSelect({
  assignees,
  value,
  onChange,
  onManageTeam,
  className,
}: Props) {
  const sorted = [...assignees].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className={className}>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="app-input w-full cursor-pointer"
      >
        <option value="">Unassigned</option>
        {sorted.map((person) => (
          <option key={person.id} value={person.id}>
            {person.name}
          </option>
        ))}
      </select>

      {value && (
        <div className="app-assignee-badge mt-2 text-xs">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{
              backgroundColor: assigneeColor(
                assignees.find((a) => a.id === value)?.colorIndex ?? 0,
              ),
            }}
          />
          {assignees.find((a) => a.id === value)?.name}
        </div>
      )}

      <GhostButton
        type="button"
        className="mt-3 w-full justify-start gap-2 text-xs"
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
