import {
  Bell,
  BellOff,
  ChevronDown,
  ImagePlus,
  Sparkles,
  TextAlignStart,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useData } from '../context/DataContext'
import { db } from '../db'
import { useTaskFieldDraft } from '../hooks/useTaskFieldDraft'
import { projectColor } from '../lib/constants'
import { absolute } from '../lib/dateFormatting'
import { AssigneeSelect } from './AssigneeSelect'
import { StatusPicker } from './StatusPicker'
import type { Assignee, Project, TaskAttachment, TaskItem, TaskStatus } from '../types'
import {
  cancelNotification,
  getNotificationSupport,
  requestNotificationPermission,
  syncNotificationForTask,
} from '../services/notifications'
import { cn, EmptyState, GhostButton } from './ui'

function defaultDeadline(): number {
  return Date.now() + 60 * 60 * 1000
}

type Props = {
  taskId: string | null
  project: Project | null
  assignees: Assignee[]
  composeTaskId: string | null
  onComposeDismiss: () => void
  onManageAssignees: () => void
  onClose?: () => void
  onDeleted: () => void
}

export function TaskDetailPanel({
  taskId,
  project,
  assignees,
  composeTaskId,
  onComposeDismiss,
  onManageAssignees,
  onClose,
  onDeleted,
}: Props) {
  const { tasks, updateTask: patchTask, deleteTask: removeTaskApi } = useData()
  const task = useMemo(
    () => (taskId ? tasks.find((t) => t.id === taskId) : undefined),
    [tasks, taskId],
  )
  const attachments = useLiveQuery(
    () =>
      taskId
        ? db.attachments.where('taskId').equals(taskId).sortBy('sortOrder')
        : [],
    [taskId],
  ) as TaskAttachment[] | undefined

  const titleRef = useRef<HTMLInputElement>(null)
  const [hasDeadline, setHasDeadline] = useState(false)
  const [showExtras, setShowExtras] = useState(false)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [notifPermission, setNotifPermission] = useState(getNotificationSupport())
  const [savedFlash, setSavedFlash] = useState(false)

  const isCompose = taskId != null && taskId === composeTaskId

  const persist = useCallback(
    async (patch: Partial<TaskItem>) => {
      if (!taskId) return
      await patchTask(taskId, patch)
      const fresh = { ...task!, ...patch, updatedAt: Date.now() } as TaskItem
      await syncNotificationForTask(fresh)
      setSavedFlash(true)
      window.setTimeout(() => setSavedFlash(false), 1200)
    },
    [taskId, task, patchTask],
  )

  const {
    draft,
    setTitle,
    setDescription,
    onTitleFocus,
    onDescriptionFocus,
    onTitleBlur,
    onDescriptionBlur,
  } = useTaskFieldDraft(task, taskId, persist)

  useEffect(() => {
    setNotifPermission(getNotificationSupport())
  }, [])

  useEffect(() => {
    if (task) setHasDeadline(task.deadline != null)
  }, [task?.id, task?.deadline])

  useEffect(() => {
    if (!isCompose || !task) return
    setShowExtras(false)
    const t = window.setTimeout(() => titleRef.current?.focus(), 80)
    return () => window.clearTimeout(t)
  }, [isCompose, task?.id, task])

  const importFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!taskId || !task) return
      const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
      if (list.length === 0) {
        setAttachmentError('Please choose image files only.')
        return
      }
      let nextOrder =
        (attachments?.reduce((m, a) => Math.max(m, a.sortOrder), -1) ?? -1) + 1
      try {
        for (const file of list) {
          await db.attachments.add({
            id: crypto.randomUUID(),
            taskId,
            fileName: file.name,
            mimeType: file.type,
            blob: file,
            sortOrder: nextOrder++,
          })
        }
        await persist({})
      } catch (e) {
        setAttachmentError(e instanceof Error ? e.message : 'Could not add images.')
      }
    },
    [attachments, persist, task, taskId],
  )

  const previewUrls = useMemo(() => {
    if (!attachments) return []
    return attachments.map((a) => ({
      id: a.id,
      url: URL.createObjectURL(a.blob),
      name: a.fileName,
    }))
  }, [attachments])

  useEffect(() => {
    return () => {
      for (const p of previewUrls) URL.revokeObjectURL(p.url)
    }
  }, [previewUrls])

  if (!taskId || !task) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <EmptyState
          icon={<TextAlignStart className="h-6 w-6" />}
          title="Select a task"
          description={
            project
              ? 'Choose a task from the list or assign new work to a teammate.'
              : 'Choose a project from the menu at the top.'
          }
        />
      </div>
    )
  }

  async function deleteTask() {
    if (!taskId) return
    cancelNotification(taskId)
    await db.attachments.where('taskId').equals(taskId).delete()
    await removeTaskApi(taskId)
    setConfirmDelete(false)
    onComposeDismiss()
    onDeleted()
  }

  async function removeAttachment(id: string) {
    await db.attachments.delete(id)
    await persist({})
  }

  const showNotifBanner =
    hasDeadline && task.status !== 'done' && notifPermission === 'denied'

  const hasExtrasContent =
    Boolean(draft.taskDescription.trim()) ||
    hasDeadline ||
    (attachments?.length ?? 0) > 0

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--color-surface-raised)]">
      <div className="z-10 flex shrink-0 items-center justify-between border-b app-border bg-[var(--color-surface-raised)] px-4 py-3 lg:px-6">
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              className="rounded-lg p-2 app-text-muted app-bg-hover lg:hidden"
              aria-label="Close task"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        <span className="text-xs app-text-muted">
          {savedFlash ? (
            <span className="font-medium app-text">Saved</span>
          ) : (
            'Edits save automatically'
          )}
        </span>
        </div>
        {isCompose && (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium app-text-muted app-bg-hover"
            onClick={onComposeDismiss}
          >
            Done setup
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
      <div className="w-full px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
        {isCompose && (
          <div className="mb-6 flex gap-3 rounded-xl border app-border app-accent-soft px-4 py-3 text-sm">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 app-icon-accent" />
            <p className="app-text-muted">
              Set the <strong className="font-medium app-text">title</strong> and{' '}
              <strong className="font-medium app-text">description</strong> separately below.
              Each field saves on its own.
            </p>
          </div>
        )}

        {showNotifBanner && (
          <div className="mb-6 flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
            <BellOff className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Allow notifications in your browser to get deadline reminders.</p>
          </div>
        )}

        {/* Title block — isolated from description */}
        <header className="mb-6 border-b app-border pb-6">
          {project && (
            <p
              className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide"
              style={{ color: projectColor(project.colorIndex) }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {project.name}
            </p>
          )}
          <label className="app-label mb-2 block" htmlFor={`task-title-${taskId}`}>
            Task title
          </label>
          <input
            id={`task-title-${taskId}`}
            ref={titleRef}
            name="task-planner-title"
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            value={draft.title}
            onFocus={onTitleFocus}
            onBlur={onTitleBlur}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short, clear summary of the work"
            className="app-input w-full py-3 text-xl font-semibold leading-snug sm:text-2xl"
          />
        </header>

        <div className="space-y-6">
          <section aria-labelledby={`task-status-${taskId}`}>
            <h2 id={`task-status-${taskId}`} className="app-label mb-2">
              Status
            </h2>
            <StatusPicker
              value={task.status}
              onChange={(status: TaskStatus) => void persist({ status })}
            />
          </section>

          <section
            className="rounded-xl border app-border bg-[var(--color-fill-subtle)] p-5 sm:p-6"
            aria-labelledby={`task-assignee-${taskId}`}
          >
            <h2
              id={`task-assignee-${taskId}`}
              className="mb-4 flex items-center gap-2 text-sm font-semibold app-text"
            >
              <User className="h-4 w-4 app-icon" />
              Assignee
            </h2>
            <AssigneeSelect
              assignees={assignees}
              value={task.assigneeId}
              onChange={(assigneeId) => void persist({ assigneeId })}
              onManageTeam={onManageAssignees}
              spacious
            />
          </section>

          <section aria-labelledby={`task-desc-${taskId}`}>
            <h2
              id={`task-desc-${taskId}`}
              className="mb-2 flex items-center gap-2 text-sm font-semibold app-text"
            >
              <TextAlignStart className="h-4 w-4 app-icon" />
              Description
            </h2>
            <p className="mb-2 text-xs app-text-muted">
              Requirements, links, acceptance criteria — not the title.
            </p>
            <textarea
              id={`task-desc-${taskId}`}
              name="task-planner-description"
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              value={draft.taskDescription}
              onFocus={onDescriptionFocus}
              onBlur={onDescriptionBlur}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details for the assignee…"
              rows={isCompose ? 8 : 12}
              className="app-input min-h-[200px] w-full resize-y px-4 py-3 text-sm leading-relaxed"
            />
          </section>

          <div className="rounded-xl border app-border">
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium app-text app-bg-hover"
              onClick={() => setShowExtras((v) => !v)}
              aria-expanded={showExtras || hasExtrasContent}
            >
              <span className="inline-flex items-center gap-2">
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition',
                    (showExtras || hasExtrasContent) && 'rotate-180',
                  )}
                />
                Deadline & attachments
              </span>
              <span className="text-xs font-normal app-text-muted">Optional</span>
            </button>

            {(showExtras || hasExtrasContent) && (
              <div className="space-y-4 border-t app-border px-4 py-4">
                <div>
                  <label className="flex cursor-pointer items-center justify-between gap-3 text-sm app-text">
                    <span className="inline-flex items-center gap-2">
                      <Bell className="h-4 w-4 app-text-muted" />
                      Set a deadline
                    </span>
                    <input
                      type="checkbox"
                      checked={hasDeadline}
                      onChange={(e) => {
                        const enabled = e.target.checked
                        setHasDeadline(enabled)
                        void persist({
                          deadline: enabled ? (task.deadline ?? defaultDeadline()) : null,
                        })
                      }}
                      className="h-4 w-4 rounded accent-zinc-700"
                    />
                  </label>

                  {hasDeadline && (
                    <div className="mt-3 space-y-3">
                      <input
                        type="datetime-local"
                        value={toLocalInputValue(task.deadline ?? defaultDeadline())}
                        onChange={(e) => {
                          const ms = new Date(e.target.value).getTime()
                          if (!Number.isNaN(ms)) void persist({ deadline: ms })
                        }}
                        className="app-input w-full text-sm"
                      />
                      <p className="text-xs app-text-muted">
                        {absolute(new Date(task.deadline ?? defaultDeadline()))}
                      </p>
                      <label className="flex cursor-pointer items-center justify-between gap-3 text-sm app-text">
                        <span>Notify when due</span>
                        <input
                          type="checkbox"
                          checked={task.notificationEnabled}
                          onChange={async (e) => {
                            if (e.target.checked && notifPermission !== 'granted') {
                              const p = await requestNotificationPermission()
                              setNotifPermission(p)
                            }
                            void persist({ notificationEnabled: e.target.checked })
                          }}
                          className="h-4 w-4 rounded accent-zinc-700"
                        />
                      </label>
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium app-text-muted">
                      <ImagePlus className="mr-1 inline h-4 w-4" />
                      Images
                    </span>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg app-bg-subtle px-3 py-1.5 text-xs font-medium app-text app-bg-hover">
                      <Upload className="h-3.5 w-3.5" />
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) void importFiles(e.target.files)
                          e.target.value = ''
                        }}
                      />
                    </label>
                  </div>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragOver(true)
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setDragOver(false)
                      if (e.dataTransfer.files.length) void importFiles(e.dataTransfer.files)
                    }}
                    className={cn(
                      'rounded-lg border border-dashed p-4',
                      dragOver ? 'border-2 app-accent-soft' : 'app-border app-bg-subtle',
                    )}
                    style={
                      dragOver ? { borderColor: 'var(--color-accent-ring)' } : undefined
                    }
                  >
                    {!attachments?.length ? (
                      <p className="py-4 text-center text-xs app-text-muted">
                        Drop images here
                      </p>
                    ) : (
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
                        {previewUrls.map((p) => (
                          <div
                            key={p.id}
                            className="group relative overflow-hidden rounded-lg ring-1 app-border"
                          >
                            <img
                              src={p.url}
                              alt={p.name}
                              className="aspect-square w-full object-cover"
                            />
                            <button
                              type="button"
                              className="absolute right-1 top-1 rounded-md bg-black/70 p-1 text-white opacity-0 transition group-hover:opacity-100"
                              onClick={() => void removeAttachment(p.id)}
                              aria-label="Remove image"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end border-t app-border pt-6">
            <GhostButton
              className="text-red-600 hover:bg-red-500/10 hover:text-red-700"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete task
            </GhostButton>
          </div>
        </div>
      </div>
      </div>

      {attachmentError && (
        <div className="fixed bottom-4 right-4 rounded-lg border border-red-500/30 bg-red-950/90 px-4 py-3 text-sm text-red-100 shadow-xl">
          {attachmentError}
          <button type="button" className="ml-4 underline" onClick={() => setAttachmentError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ background: 'var(--color-backdrop)' }}
        >
          <div className="max-w-sm rounded-2xl border app-border bg-[var(--color-surface-overlay)] p-6">
            <h3 className="text-lg font-bold app-text">Delete this task?</h3>
            <p className="mt-2 text-sm app-text-muted">
              This removes the task and its attachments.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <GhostButton onClick={() => setConfirmDelete(false)}>Cancel</GhostButton>
              <button
                type="button"
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                onClick={() => void deleteTask()}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function toLocalInputValue(ms: number): string {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
