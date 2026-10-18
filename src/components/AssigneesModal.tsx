import { Trash2, UserPlus, Users } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { assigneeColor } from '../lib/assigneeColors'
import type { TeamDiscipline } from '../types'
import { Modal, PrimaryButton } from './ui'

type Props = {
  open: boolean
  onClose: () => void
}

const TEAMS: { id: TeamDiscipline; label: string }[] = [
  { id: 'frontend', label: 'Frontend' },
  { id: 'backend', label: 'Backend' },
  { id: 'other', label: 'Other' },
]

export function AssigneesModal({ open, onClose }: Props) {
  const { isAdmin } = useAuth()
  const { assignees, addMember, deleteMember } = useData()
  const [name, setName] = useState('')
  const [team, setTeam] = useState<TeamDiscipline>('frontend')
  const [error, setError] = useState<string | null>(null)

  async function addAssignee() {
    const trimmed = name.trim()
    if (!trimmed || !isAdmin) return
    const exists = assignees.some(
      (a) => a.name.toLowerCase() === trimmed.toLowerCase(),
    )
    if (exists) {
      setError('Someone with this name already exists.')
      return
    }
    try {
      await addMember(trimmed, team)
      setName('')
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add member')
    }
  }

  return (
    <Modal open={open} title="Team members" onClose={onClose}>
      <p className="-mt-2 mb-4 text-sm app-text-muted">
        Frontend and backend teammates appear in the sidebar. Admins assign tasks and
        view completion stats.
      </p>

      {isAdmin && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError(null)
            }}
            placeholder="Full name"
            className="app-input min-w-0 flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') void addAssignee()
            }}
          />
          <select
            className="app-input cursor-pointer py-2 text-sm sm:w-36"
            value={team}
            onChange={(e) => setTeam(e.target.value as TeamDiscipline)}
          >
            {TEAMS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <PrimaryButton
            type="button"
            className="shrink-0 px-3"
            disabled={!name.trim()}
            onClick={() => void addAssignee()}
          >
            <UserPlus className="h-4 w-4" />
            Add
          </PrimaryButton>
        </div>
      )}

      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

      {assignees.length === 0 ? (
        <div className="rounded-xl border border-dashed app-border py-10 text-center app-bg-subtle">
          <Users className="mx-auto mb-2 h-8 w-8 app-text-muted" />
          <p className="text-sm app-text-muted">
            No team members yet. Ask an admin to add your squad.
          </p>
        </div>
      ) : (
        <ul className="max-h-64 space-y-1 overflow-y-auto scrollbar-thin rounded-xl border app-border p-2">
          {assignees.map((person) => (
            <li
              key={person.id}
              className="flex items-center gap-3 rounded-lg px-3 py-2 app-bg-subtle"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold app-border app-text"
                style={{
                  borderLeftWidth: 3,
                  borderLeftColor: assigneeColor(person.colorIndex),
                }}
              >
                {person.name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium app-text">
                {person.name}
                <span className="ml-2 text-xs font-normal capitalize app-text-muted">
                  {person.team}
                </span>
              </span>
              {isAdmin && (
                <button
                  type="button"
                  aria-label={`Remove ${person.name}`}
                  className="rounded-md p-1.5 app-text-muted transition hover:bg-red-500/15 hover:text-red-500"
                  onClick={() => void deleteMember(person.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex justify-end">
        <PrimaryButton type="button" onClick={onClose}>
          Done
        </PrimaryButton>
      </div>
    </Modal>
  )
}
