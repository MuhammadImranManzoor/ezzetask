import { FolderKanban, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { projectColor } from '../lib/constants'
import type { Project } from '../types'
import { GhostButton, Modal, PrimaryButton } from './ui'

type Props = {
  open: boolean
  openTaskCountByProject: Map<string, number>
  onClose: () => void
  onCreate: () => void
  onEdit: (project: Project) => void
  onDeleted: (projectId: string) => void
}

export function ProjectsManageModal({
  open,
  openTaskCountByProject,
  onClose,
  onCreate,
  onEdit,
  onDeleted,
}: Props) {
  const { isAdmin } = useAuth()
  const { projects, deleteProject } = useData()
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
  const [busy, setBusy] = useState(false)

  async function confirmDelete() {
    if (!deleteTarget || !isAdmin) return
    setBusy(true)
    try {
      await deleteProject(deleteTarget.id)
      onDeleted(deleteTarget.id)
      setDeleteTarget(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Modal open={open} title="Projects" onClose={onClose}>
        <p className="-mt-2 mb-4 text-sm app-text-muted">
          Edit names and colors, or remove a project and all of its tasks.
        </p>

        {isAdmin && (
          <PrimaryButton type="button" className="mb-4 w-full sm:w-auto" onClick={onCreate}>
            <Plus className="h-4 w-4" />
            New project
          </PrimaryButton>
        )}

        {projects.length === 0 ? (
          <div className="rounded-xl border border-dashed py-10 text-center app-border app-bg-subtle">
            <FolderKanban className="mx-auto mb-2 h-8 w-8 app-text-muted" />
            <p className="text-sm app-text-muted">No projects yet.</p>
          </div>
        ) : (
          <ul className="max-h-72 space-y-1 overflow-y-auto scrollbar-thin rounded-xl border p-2 app-border">
            {projects.map((project) => {
              const color = projectColor(project.colorIndex)
              const open = openTaskCountByProject.get(project.id) ?? 0
              return (
                <li
                  key={project.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 app-bg-subtle"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${color}22`, color }}
                  >
                    <FolderKanban className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium app-text">{project.name}</p>
                    <p className="text-xs app-text-muted">{open} open tasks</p>
                  </div>
                  {isAdmin && (
                    <div className="flex shrink-0 gap-0.5">
                      <button
                        type="button"
                        aria-label={`Edit ${project.name}`}
                        className="rounded-md p-2 app-text-muted app-bg-hover hover:app-text"
                        onClick={() => {
                          onEdit(project)
                          onClose()
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${project.name}`}
                        className="rounded-md p-2 app-text-muted hover:bg-red-500/15 hover:text-red-500"
                        onClick={() => setDeleteTarget(project)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        <div className="mt-6 flex justify-end">
          <PrimaryButton type="button" onClick={onClose}>
            Done
          </PrimaryButton>
        </div>
      </Modal>

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ background: 'var(--color-backdrop)' }}
        >
          <div className="max-w-sm rounded-2xl border p-6 app-border bg-[var(--color-surface-overlay)]">
            <h3 className="text-lg font-bold app-text">Delete project?</h3>
            <p className="mt-2 text-sm app-text-muted">
              “{deleteTarget.name}” and every task in it will be removed permanently.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <GhostButton disabled={busy} onClick={() => setDeleteTarget(null)}>
                Cancel
              </GhostButton>
              <button
                type="button"
                disabled={busy}
                className="rounded-lg bg-red-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                onClick={() => void confirmDelete()}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
