import { useLiveQuery } from 'dexie-react-hooks'
import { Trash2, UserPlus, Users } from 'lucide-react'
import { useState } from 'react'
import { db } from '../db'
import { assigneeColor } from '../lib/assigneeColors'
import type { Assignee } from '../types'
import { Modal, PrimaryButton } from './ui'

type Props = {
  open: boolean
  onClose: () => void
}

export function AssigneesModal({ open, onClose }: Props) {
  const assignees = useLiveQuery(
    () => (open ? db.assignees.orderBy('name').toArray() : []),
    [open],
    [],
  ) as Assignee[]

  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function addAssignee() {
    const trimmed = name.trim()
    if (!trimmed) return
    const exists = assignees.some(
      (a) => a.name.toLowerCase() === trimmed.toLowerCase(),
    )
    if (exists) {
      setError('Someone with this name already exists.')
      return
    }
    const count = await db.assignees.count()
    const person: Assignee = {
      id: crypto.randomUUID(),
      name: trimmed,
      colorIndex: count % 8,
      createdAt: Date.now(),
    }
    await db.assignees.add(person)
    setName('')
    setError(null)
  }

  async function removeAssignee(id: string) {
    await db.tasks.where('assigneeId').equals(id).modify({ assigneeId: null })
    await db.assignees.delete(id)
  }

  return (
    <Modal open={open} title="Team members" onClose={onClose}>
      <p className="-mt-2 mb-4 text-sm app-text-muted">
        Add everyone on your software team. Admins assign tasks to these names; each person
        filters the sidebar by their name to see their work.
      </p>

      <div className="mb-4 flex gap-2">
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

      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

      {assignees.length === 0 ? (
        <div className="rounded-xl border border-dashed app-border py-10 text-center app-bg-subtle">
          <Users className="mx-auto mb-2 h-8 w-8 app-text-muted" />
          <p className="text-sm app-text-muted">No assignees yet. Add your first team member above.</p>
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
              </span>
              <button
                type="button"
                aria-label={`Remove ${person.name}`}
                className="rounded-md p-1.5 app-text-muted transition hover:bg-red-500/15 hover:text-red-500"
                onClick={() => void removeAssignee(person.id)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
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
