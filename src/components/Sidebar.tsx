import {
  Building2,
  FolderPlus,
  LayoutGrid,
  Pencil,
  Plus,
  Trash2,
  User,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { db } from '../db'
import { assigneeColor } from '../lib/assigneeColors'
import { APP_NAME, APP_TAGLINE, projectColor } from '../lib/constants'
import { countOpenTasksForAssignee, setMyAssigneeId } from '../lib/workspace'
import type { Assignee, BrowseMode, Project, TaskItem } from '../types'
import { cancelNotification } from '../services/notifications'
import { ProjectModal } from './ProjectModal'
import { ThemeToggle } from './ThemeToggle'
import { cn, GhostButton } from './ui'

type Props = {
  projects: Project[]
  assignees: Assignee[]
  tasks: TaskItem[]
  tasksByProject: Map<string, number>
  browseMode: BrowseMode
  selectedProjectId: string | null
  assigneeFilterId: string | null
  myAssigneeId: string | null
  onBrowseCompany: () => void
  onBrowseAssignee: (id: string) => void
  onBrowseProject: (id: string) => void
  onMyTasks: () => void
  onMyProfileChange: (id: string | null) => void
  onProjectCreated: (id: string) => void
  onManageTeam: () => void
}

export function Sidebar({
  projects,
  assignees,
  tasks,
  tasksByProject,
  browseMode,
  selectedProjectId,
  assigneeFilterId,
  myAssigneeId,
  onBrowseCompany,
  onBrowseAssignee,
  onBrowseProject,
  onMyTasks,
  onMyProfileChange,
  onProjectCreated,
  onManageTeam,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)

  async function saveProject(name: string, colorIndex: number) {
    if (editing) {
      await db.projects.update(editing.id, { name, colorIndex })
    } else {
      const sortOrder =
        (await db.projects.orderBy('sortOrder').last())?.sortOrder ?? -1
      const project: Project = {
        id: crypto.randomUUID(),
        name,
        colorIndex,
        createdAt: Date.now(),
        sortOrder: sortOrder + 1,
      }
      await db.projects.add(project)
      onProjectCreated(project.id)
    }
    setModalOpen(false)
    setEditing(null)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const projectTasks = await db.tasks.where('projectId').equals(deleteTarget.id).toArray()
    for (const task of projectTasks) {
      cancelNotification(task.id)
      await db.attachments.where('taskId').equals(task.id).delete()
      await db.tasks.delete(task.id)
    }
    await db.projects.delete(deleteTarget.id)
    setDeleteTarget(null)
  }

  const myProfile = assignees.find((a) => a.id === myAssigneeId)

  return (
    <>
      <aside className="app-sidebar flex h-full flex-col border-r app-border bg-[var(--color-surface-raised)]">
        <div className="border-b app-border px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="app-brand-icon flex h-9 w-9 items-center justify-center rounded-xl">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight app-text">{APP_NAME}</p>
              <p className="text-xs app-text-muted">{APP_TAGLINE}</p>
            </div>
          </div>
        </div>

        <div className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
          {myProfile && (
            <button
              type="button"
              onClick={onMyTasks}
              className={cn(
                'mb-3 flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition app-border',
                assigneeFilterId === myProfile.id
                  ? 'app-accent-soft app-accent-ring'
                  : 'app-bg-subtle app-bg-hover',
              )}
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
                style={{ backgroundColor: assigneeColor(myProfile.colorIndex) }}
              >
                {myProfile.name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold app-text">My tasks</span>
                <span className="text-xs app-text-muted">
                  {countOpenTasksForAssignee(tasks, myProfile.id, assignees)} open assigned to you
                </span>
              </span>
            </button>
          )}

          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider app-text-muted">
            Team
          </p>
          <ul className="mb-4 space-y-0.5">
            <li>
              <button
                type="button"
                onClick={onBrowseCompany}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition',
                  browseMode === 'company'
                    ? 'app-accent-soft app-accent-ring app-filter-active'
                    : 'app-text-muted app-bg-hover hover:text-[var(--color-text)]',
                )}
              >
                <Building2 className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">All team tasks</span>
                <span className="text-xs app-text-faint">{tasks.length}</span>
              </button>
            </li>
            {assignees.map((person) => {
              const open = countOpenTasksForAssignee(tasks, person.id, assignees)
              const active = assigneeFilterId === person.id
              return (
                <li key={person.id}>
                  <button
                    type="button"
                    onClick={() => onBrowseAssignee(person.id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition',
                      active
                        ? 'app-accent-soft app-accent-ring app-filter-active'
                        : 'app-text-muted app-bg-hover hover:text-[var(--color-text)]',
                    )}
                  >
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white"
                      style={{ backgroundColor: assigneeColor(person.colorIndex) }}
                    >
                      {person.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-left">{person.name}</span>
                    <span className="text-xs tabular-nums app-text-faint">{open}</span>
                  </button>
                </li>
              )
            })}
            {assignees.length === 0 && (
              <li className="px-3 py-2 text-xs app-text-muted">
                Add team members below to assign tasks.
              </li>
            )}
          </ul>

          <div className="mb-2 flex items-center justify-between px-2">
            <span className="text-xs font-semibold uppercase tracking-wider app-text-muted">
              Projects
            </span>
            <button
              type="button"
              className="rounded-md p-1 app-text-muted transition app-bg-hover hover:text-[var(--color-text)]"
              aria-label="Add project"
              onClick={() => {
                setEditing(null)
                setModalOpen(true)
              }}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <ul className="space-y-0.5">
            {projects.map((project) => {
              const selected =
                browseMode === 'project' && selectedProjectId === project.id
              const openCount = tasksByProject.get(project.id) ?? 0
              const color = projectColor(project.colorIndex)
              return (
                <li key={project.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => onBrowseProject(project.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition',
                      selected
                        ? 'app-text shadow-inner bg-[var(--color-fill-active)]'
                        : 'app-text-muted app-bg-hover hover:text-[var(--color-text)]',
                    )}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${color}18`, color }}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{project.name}</span>
                      <span className="text-xs app-text-muted">{openCount} open</span>
                    </span>
                  </button>
                  <div className="absolute right-1 top-1/2 hidden -translate-y-1/2 gap-0.5 group-hover:flex">
                    <button
                      type="button"
                      className="rounded p-1 app-text-muted app-bg-hover hover:text-[var(--color-text)]"
                      aria-label="Edit project"
                      onClick={() => {
                        setEditing(project)
                        setModalOpen(true)
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="rounded p-1 app-text-muted hover:bg-red-500/20 hover:text-red-500"
                      aria-label="Delete project"
                      onClick={() => setDeleteTarget(project)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="space-y-2 border-t app-border p-3">
          <label className="block px-1">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium app-text-muted">
              <User className="h-3.5 w-3.5" />
              I am (for My tasks)
            </span>
            <select
              value={myAssigneeId ?? ''}
              onChange={(e) => {
                const id = e.target.value || null
                setMyAssigneeId(id)
                onMyProfileChange(id)
              }}
              className="app-input w-full cursor-pointer py-2 text-xs"
            >
              <option value="">Select your name…</option>
              {assignees.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <ThemeToggle />
          <GhostButton className="w-full justify-start gap-2" onClick={onManageTeam}>
            <Users className="h-4 w-4" />
            Manage team
          </GhostButton>
          <GhostButton
            className="w-full justify-start gap-2"
            onClick={() => {
              setEditing(null)
              setModalOpen(true)
            }}
          >
            <FolderPlus className="h-4 w-4" />
            New project
          </GhostButton>
        </div>
      </aside>

      <ProjectModal
        open={modalOpen}
        editing={editing}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSave={saveProject}
      />

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ background: 'var(--color-backdrop)' }}
        >
          <div className="max-w-sm rounded-2xl border app-border bg-[var(--color-surface-overlay)] p-6">
            <h3 className="text-lg font-bold app-text">Delete project?</h3>
            <p className="mt-2 text-sm app-text-muted">
              “{deleteTarget.name}” and all of its tasks will be permanently removed.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <GhostButton onClick={() => setDeleteTarget(null)}>Cancel</GhostButton>
              <button
                type="button"
                className="rounded-lg bg-red-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
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
