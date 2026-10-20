import {
  BarChart3,
  ChevronDown,
  LayoutGrid,
  Pencil,
  Plus,
  Settings2,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { projectColor } from '../lib/constants'
import type { Assignee, BrowseMode, Project } from '../types'
import { ThemeToggle } from './ThemeToggle'
import { cn, PrimaryButton } from './ui'

type Props = {
  projects: Project[]
  assignees: Assignee[]
  browseMode: BrowseMode
  selectedProjectId: string | null
  assigneeFilterId: string | null
  myAssigneeId: string | null
  searchText: string
  openByProject: Map<string, number>
  isAdmin: boolean
  onProjectChange: (projectId: string | null) => void
  onAssigneeChange: (assigneeId: string | null) => void
  onMyTasks: () => void
  onInsights: () => void
  onTasksView: () => void
  onSearchChange: (value: string) => void
  onNewTask: () => void
  onManageTeam: () => void
  onManageProjects: () => void
  onEditProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
}

export function AppHeader({
  projects,
  assignees,
  browseMode,
  selectedProjectId,
  assigneeFilterId,
  myAssigneeId,
  searchText,
  openByProject,
  isAdmin,
  onProjectChange,
  onAssigneeChange,
  onMyTasks,
  onInsights,
  onTasksView,
  onSearchChange,
  onNewTask,
  onManageTeam,
  onManageProjects,
  onEditProject,
  onDeleteProject,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)

  const projectValue =
    browseMode === 'company' ? '__all__' : (selectedProjectId ?? '__all__')

  const sortedAssignees = useMemo(
    () => [...assignees].sort((a, b) => a.name.localeCompare(b.name)),
    [assignees],
  )

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  return (
    <header className="app-topbar shrink-0 border-b app-border">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="app-brand-mark flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
            <LayoutGrid className="h-4 w-4" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold leading-tight app-text">Ezzetask</p>
            <p className="text-[11px] app-text-muted">Project workspace</p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 lg:gap-3">
          <label className="relative min-w-[10rem] flex-1 sm:max-w-xs">
            <span className="sr-only">Project</span>
            <LayoutGrid className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 app-text-muted" />
            <select
              value={projectValue}
              onChange={(e) => {
                const v = e.target.value
                onProjectChange(v === '__all__' ? null : v)
              }}
              className="app-select w-full py-2 pl-9 pr-8 text-sm font-medium"
            >
              <option value="__all__">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({openByProject.get(p.id) ?? 0} open)
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 app-text-faint" />
          </label>

          <label className="relative min-w-[9rem] flex-1 sm:max-w-[11rem]">
            <span className="sr-only">Assignee</span>
            <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 app-text-muted" />
            <select
              value={assigneeFilterId ?? ''}
              onChange={(e) => onAssigneeChange(e.target.value || null)}
              className="app-select w-full py-2 pl-9 pr-8 text-sm"
            >
              <option value="">Whole team</option>
              {myAssigneeId && (
                <option value={myAssigneeId}>My tasks</option>
              )}
              {sortedAssignees
                .filter((a) => a.id !== myAssigneeId)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 app-text-faint" />
          </label>

          <div className="hidden min-w-[12rem] flex-1 items-center gap-2 rounded-lg app-toolbar-search px-3 py-2 md:flex lg:max-w-sm">
            <Search className="h-4 w-4 shrink-0 app-text-muted" />
            <input
              value={searchText}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tasks…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none app-text placeholder:app-text-faint"
            />
            {searchText && (
              <button
                type="button"
                aria-label="Clear search"
                className="app-text-muted"
                onClick={() => onSearchChange('')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isAdmin && (
            <div className="hidden items-center rounded-lg p-0.5 app-segment sm:flex">
              <button
                type="button"
                onClick={onTasksView}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition',
                  browseMode !== 'admin'
                    ? 'app-segment-active'
                    : 'app-text-muted app-bg-hover',
                )}
              >
                Tasks
              </button>
              <button
                type="button"
                onClick={onInsights}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition',
                  browseMode === 'admin'
                    ? 'app-segment-active'
                    : 'app-text-muted app-bg-hover',
                )}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Insights
              </button>
            </div>
          )}

          <PrimaryButton
            className="px-3 py-2 text-sm"
            data-testid="new-task-button"
            onClick={onNewTask}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New task</span>
          </PrimaryButton>

          <div className="relative">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border app-border app-text-muted app-bg-hover hover:app-text"
              aria-label="Menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <Settings2 className="h-4 w-4" />
            </button>
            {menuOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40 cursor-default"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 z-50 mt-1 w-56 rounded-xl border py-1 shadow-lg app-border app-surface-overlay">
                  {myAssigneeId && (
                    <button
                      type="button"
                      className="flex w-full px-3 py-2 text-left text-sm app-bg-hover app-text"
                      onClick={() => {
                        onMyTasks()
                        setMenuOpen(false)
                      }}
                    >
                      My tasks
                    </button>
                  )}
                  <button
                    type="button"
                    className="flex w-full px-3 py-2 text-left text-sm app-bg-hover app-text"
                    onClick={() => {
                      onManageTeam()
                      setMenuOpen(false)
                    }}
                  >
                    Manage team
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      className="flex w-full px-3 py-2 text-left text-sm app-bg-hover app-text"
                      onClick={() => {
                        onManageProjects()
                        setMenuOpen(false)
                      }}
                    >
                      Manage projects
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      type="button"
                      className="flex w-full px-3 py-2 text-left text-sm app-bg-hover app-text sm:hidden"
                      onClick={() => {
                        onInsights()
                        setMenuOpen(false)
                      }}
                    >
                      Team insights
                    </button>
                  )}
                  <div className="border-t app-border px-3 py-2">
                    <ThemeToggle />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t px-4 py-2 app-border md:hidden">
        <Search className="h-4 w-4 shrink-0 app-text-muted" />
        <input
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks…"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none app-text"
        />
      </div>

      {selectedProject && browseMode === 'project' && (
        <div
          className="flex items-center gap-2 border-t px-4 py-2 text-xs app-border lg:px-6"
          style={{
            borderLeftWidth: 3,
            borderLeftColor: projectColor(selectedProject.colorIndex),
          }}
        >
          <span className="font-semibold app-text">{selectedProject.name}</span>
          <span className="app-text-muted">
            · {openByProject.get(selectedProject.id) ?? 0} open tasks
          </span>
          {assigneeFilterId && (
            <span className="rounded-md px-2 py-0.5 app-accent-soft app-text-muted">
              Filtered by assignee
            </span>
          )}
          {isAdmin && selectedProject && (
            <div className="ml-auto flex gap-0.5">
              <button
                type="button"
                aria-label={`Edit ${selectedProject.name}`}
                className="rounded-md p-1.5 app-text-muted app-bg-hover hover:app-text"
                onClick={() => onEditProject(selectedProject)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label={`Delete ${selectedProject.name}`}
                className="rounded-md p-1.5 app-text-muted hover:bg-red-500/15 hover:text-red-500"
                onClick={() => onDeleteProject(selectedProject)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
