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
import { useData } from '../context/DataContext'
import { useTaskEdit } from '../context/TaskEditContext'
import { useTaskAttachments } from '../hooks/useTaskAttachments'
import { useTaskEditorForm } from '../hooks/useTaskEditorForm'
import { useToast } from '../context/ToastContext'
import { projectColor } from '../lib/constants'
import { absolute } from '../lib/dateFormatting'
import { AssigneeSelect } from './AssigneeSelect'
import { StatusPicker } from './StatusPicker'
import type { Assignee, Project, TaskStatus } from '../types'
import {
  cancelNotification,
  getNotificationSupport,
  requestNotificationPermission,
  syncNotificationForTask,
} from '../services/notifications'
import { cn, EmptyState, GhostButton, PrimaryButton } from './ui'

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
  onAttachmentsChanged?: () => void
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
  onAttachmentsChanged,
}: Props) {
  const { tasks, updateTask: patchTask, deleteTask: removeTaskApi } = useData()
  const { pushToast } = useToast()
  const { setEditorState, registerDiscardHandler } = useTaskEdit()
  const task = useMemo(
    () => (taskId ? tasks.find((t) => t.id === taskId) : undefined),
    [tasks, taskId],
  )
  const {
    items: attachments,
    addFiles,
    remove: removeAttachment,
  } = useTaskAttachments(taskId)

  const titleRef = useRef<HTMLInputElement>(null)
  const [showExtras, setShowExtras] = useState(true)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [notifPermission, setNotifPermission] = useState(getNotificationSupport())
  const [savedFlash, setSavedFlash] = useState(false)
  const [saving, setSaving] = useState(false)

  const isCompose = taskId != null && taskId === composeTaskId

  const { form, setForm, isDirty, canSave, patchFromForm, applySavedTask, discardEdits } =
    useTaskEditorForm(task, taskId)

  useEffect(() => {
    setEditorState({
      taskId,
      isDirty,
      draftTitle: form.title,
    })
  }, [taskId, isDirty, form.title, setEditorState])

  useEffect(() => {
    registerDiscardHandler(discardEdits)
    return () => registerDiscardHandler(null)
  }, [discardEdits, registerDiscardHandler])

  useEffect(() => {
    const onRefresh = () => {
      if (!isDirty) pushToast('Tasks updated from the server.', 'info')
    }
    window.addEventListener('ezzetask:data-refreshed', onRefresh)
    return () => window.removeEventListener('ezzetask:data-refreshed', onRefresh)
  }, [isDirty, pushToast])

  const handleSave = useCallback(async () => {
    if (!taskId || !task || !canSave || saving) return
    setSaving(true)
    try {
      if (
        form.notificationEnabled &&
        form.hasDeadline &&
        notifPermission !== 'granted'
      ) {
        const p = await requestNotificationPermission()
        setNotifPermission(p)
      }
      const saved = await patchTask(taskId, patchFromForm())
      applySavedTask(saved)
      await syncNotificationForTask(saved)
      setSavedFlash(true)
      window.setTimeout(() => setSavedFlash(false), 2000)
    } catch (e) {
      pushToast(e instanceof Error ? e.message : 'Could not save task')
    } finally {
      setSaving(false)
    }
  }, [
    taskId,
    task,
    canSave,
    saving,
    form.notificationEnabled,
    form.hasDeadline,
    notifPermission,
    patchTask,
    patchFromForm,
    applySavedTask,
    pushToast,
  ])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        void handleSave()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleSave])

  useEffect(() => {
    setNotifPermission(getNotificationSupport())
  }, [])

  useEffect(() => {
    setShowExtras(true)
  }, [taskId])

  useEffect(() => {
    if (!isCompose || !task) return
    const t = window.setTimeout(() => titleRef.current?.focus(), 80)
    return () => window.clearTimeout(t)
  }, [isCompose, task?.id, task])

  const importFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!taskId || !task) return
      try {
        await addFiles(files)
        onAttachmentsChanged?.()
      } catch (e) {
        setAttachmentError(e instanceof Error ? e.message : 'Could not add images.')
      }
    },
    [addFiles, onAttachmentsChanged, task, taskId],
  )

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
    await removeTaskApi(taskId)
    onAttachmentsChanged?.()
    setConfirmDelete(false)
    onComposeDismiss()
    onDeleted()
  }

  const showNotifBanner =
    form.hasDeadline && form.status !== 'done' && notifPermission === 'denied'

  const hasExtrasContent =
    Boolean(form.taskDescription.trim()) ||
    form.hasDeadline ||
    attachments.length > 0

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
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs app-text-muted">
            {savedFlash ? (
              <span className="font-medium app-text">Saved</span>
            ) : isDirty ? (
              <span className="font-medium text-amber-700 dark:text-amber-300">
                Unsaved changes
              </span>
            ) : (
              'All changes saved'
            )}
          </span>
          <PrimaryButton
            type="button"
            data-testid="task-save-button"
            className="px-3 py-1.5 text-xs"
            disabled={!canSave || saving}
            onClick={() => void handleSave()}
          >
            {saving ? 'Saving…' : 'Save'}
          </PrimaryButton>
        </div>
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
              <strong className="font-medium app-text">description</strong>, then click{' '}
              <strong className="font-medium app-text">Save</strong> (or ⌘S / Ctrl+S).
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
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Short, clear summary of the work"
            className="app-input w-full py-3 text-xl font-semibold leading-snug sm:text-2xl"
          />
          {isDirty && !form.title.trim() && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              Title is required before you can save.
            </p>
          )}
        </header>

        <div className="space-y-6">
          <section aria-labelledby={`task-status-${taskId}`}>
            <h2 id={`task-status-${taskId}`} className="app-label mb-2">
              Status
            </h2>
            <StatusPicker
              value={form.status}
              onChange={(status: TaskStatus) =>
                setForm((f) => ({ ...f, status }))
              }
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
              value={form.assigneeId}
              onChange={(assigneeId) => setForm((f) => ({ ...f, assigneeId }))}
              onManageTeam={onManageAssignees}
              spacious
              allowUnassigned={false}
            />
            {isDirty && !form.assigneeId && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                Choose an assignee before you can save.
              </p>
            )}
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
              value={form.taskDescription}
              onChange={(e) =>
                setForm((f) => ({ ...f, taskDescription: e.target.value }))
              }
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
                      checked={form.hasDeadline}
                      onChange={(e) => {
                        const enabled = e.target.checked
                        setForm((f) => ({
                          ...f,
                          hasDeadline: enabled,
                          deadline: enabled
                            ? (f.deadline ?? task.deadline ?? defaultDeadline())
                            : null,
                        }))
                      }}
                      className="h-4 w-4 rounded accent-zinc-700"
                    />
                  </label>

                  {form.hasDeadline && (
                    <div className="mt-3 space-y-3">
                      <input
                        type="datetime-local"
                        value={toLocalInputValue(
                          form.deadline ?? task.deadline ?? defaultDeadline(),
                        )}
                        onChange={(e) => {
                          const ms = new Date(e.target.value).getTime()
                          if (!Number.isNaN(ms)) {
                            setForm((f) => ({ ...f, deadline: ms, hasDeadline: true }))
                          }
                        }}
                        className="app-input w-full text-sm"
                      />
                      <p className="text-xs app-text-muted">
                        {absolute(
                          new Date(form.deadline ?? task.deadline ?? defaultDeadline()),
                        )}
                      </p>
                      <label className="flex cursor-pointer items-center justify-between gap-3 text-sm app-text">
                        <span>Notify when due</span>
                        <input
                          type="checkbox"
                          checked={form.notificationEnabled}
                          onChange={(e) => {
                            setForm((f) => ({
                              ...f,
                              notificationEnabled: e.target.checked,
                            }))
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
                    {!attachments.length ? (
                      <p className="py-4 text-center text-xs app-text-muted">
                        Drop images here — stored on the server so they follow this task on any device.
                      </p>
                    ) : (
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
                        {attachments.map((p) => (
                          <div
                            key={p.id}
                            className="group relative overflow-hidden rounded-lg ring-1 app-border"
                          >
                            <img
                              src={p.url}
                              alt={p.fileName}
                              className="aspect-square w-full object-cover"
                            />
                            <button
                              type="button"
                              className="absolute right-1 top-1 rounded-md bg-black/70 p-1 text-white opacity-0 transition group-hover:opacity-100"
                              onClick={() =>
                                void removeAttachment(p.id).then(() =>
                                  onAttachmentsChanged?.(),
                                )
                              }
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
