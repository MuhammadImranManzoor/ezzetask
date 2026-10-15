import { User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Assignee, Project, TaskStatus } from '../types'
import { AssigneeSelect } from './AssigneeSelect'
import { StatusPicker } from './StatusPicker'
import { GhostButton, Modal, PrimaryButton } from './ui'

type Props = {
  open: boolean
  assignees: Assignee[]
  projects: Project[]
  selectedProjectId: string | null
  defaultAssigneeId: string | null
  onClose: () => void
  onManageTeam: () => void
  onCreate: (
    title: string,
    assigneeId: string,
    status: TaskStatus,
    projectId: string,
  ) => void
}

export function NewTaskModal({
  open,
  assignees,
  projects,
  selectedProjectId,
  defaultAssigneeId,
  onClose,
  onManageTeam,
  onCreate,
}: Props) {
  const [title, setTitle] = useState('')
  const [assigneeId, setAssigneeId] = useState<string | null>(null)
  const [projectId, setProjectId] = useState<string>('')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setTitle('')
    setAssigneeId(defaultAssigneeId)
    setProjectId(selectedProjectId ?? projects[0]?.id ?? '')
    setStatus('todo')
    const t = window.setTimeout(() => inputRef.current?.focus(), 50)
    return () => window.clearTimeout(t)
  }, [open, defaultAssigneeId, selectedProjectId, projects])

  const trimmedTitle = title.trim()
  const canCreate =
    trimmedTitle.length > 0 && assigneeId != null && projectId.length > 0

  function submit() {
    if (!canCreate || !assigneeId) return
    onCreate(trimmedTitle, assigneeId, status, projectId)
  }

  return (
    <Modal open={open} title="Assign a task" onClose={onClose}>
      <p className="-mt-2 mb-5 text-sm leading-relaxed app-text-muted">
        For your team: choose who owns the work, which project it belongs to, and the
        starting status. They’ll see it under their name in the sidebar.
      </p>

      <label className="app-label mb-4 block">
        Task title
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Implement login API"
          className="app-input mt-2 w-full"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canCreate) submit()
          }}
        />
      </label>

      <div className="app-label mb-4 block">
        <span className="mb-2 inline-flex items-center gap-2">
          <User className="h-4 w-4 app-text-muted" />
          Assign to <span className="text-red-500">*</span>
        </span>
        <AssigneeSelect
          assignees={assignees}
          value={assigneeId}
          onChange={setAssigneeId}
          onManageTeam={onManageTeam}
        />
        {assignees.length === 0 && (
          <p className="mt-2 text-xs text-red-600">Add team members via Manage team first.</p>
        )}
      </div>

      <label className="app-label mb-4 block">
        Project
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="app-input mt-2 w-full cursor-pointer"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <div className="mb-6">
        <p className="app-label mb-2">Starting status</p>
        <StatusPicker value={status} onChange={setStatus} size="large" showHints />
      </div>

      <div className="flex justify-end gap-2">
        <GhostButton onClick={onClose}>Cancel</GhostButton>
        <PrimaryButton disabled={!canCreate} onClick={submit}>
          Assign task
        </PrimaryButton>
      </div>
    </Modal>
  )
}
