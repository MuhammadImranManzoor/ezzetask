import { CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { TASK_STATUS_LABEL } from '../lib/constants'
import type { TaskStatus } from '../types'
import { cn } from './ui'

const OPTIONS: {
  status: TaskStatus
  Icon: typeof Circle
  tone: 'todo' | 'progress' | 'done'
  hint: string
}[] = [
  { status: 'todo', Icon: Circle, tone: 'todo', hint: 'Not started' },
  { status: 'inProgress', Icon: Loader2, tone: 'progress', hint: 'In progress' },
  { status: 'done', Icon: CheckCircle2, tone: 'done', hint: 'Completed' },
]

type Props = {
  value: TaskStatus
  onChange: (status: TaskStatus) => void
  /** Inline row — best for task detail */
  variant?: 'inline' | 'cards'
  showHints?: boolean
}

export function StatusPicker({
  value,
  onChange,
  variant = 'inline',
  showHints = false,
}: Props) {
  if (variant === 'inline') {
    return (
      <div className="flex gap-1.5" role="radiogroup" aria-label="Task status">
        {OPTIONS.map(({ status, Icon, tone }) => {
          const selected = value === status
          return (
            <button
              key={status}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(status)}
              className={cn(
                'inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold transition',
                `app-status-picker--${tone}`,
                selected
                  ? 'app-status-picker--selected app-status-inline-selected'
                  : 'border-transparent bg-[var(--color-fill-subtle)] app-text-muted app-bg-hover',
              )}
            >
              <Icon
                className={cn(
                  'h-3.5 w-3.5 shrink-0',
                  status === 'inProgress' && selected && 'animate-spin',
                )}
              />
              <span className="truncate">{TASK_STATUS_LABEL[status]}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Task status">
      {OPTIONS.map(({ status, Icon, tone, hint }) => {
        const selected = value === status
        return (
          <button
            key={status}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(status)}
            className={cn(
              'app-status-picker flex flex-col items-center rounded-xl px-2 py-2.5 text-center',
              `app-status-picker--${tone}`,
              selected && 'app-status-picker--selected shadow-sm',
            )}
          >
            <Icon
              className={cn(
                'app-status-picker-icon mb-1 h-4 w-4 shrink-0',
                status === 'inProgress' && selected && 'animate-spin',
              )}
            />
            <span
              className={cn(
                'app-status-picker-label text-xs font-semibold',
                !selected && 'app-text-muted',
              )}
            >
              {TASK_STATUS_LABEL[status]}
            </span>
            {showHints && (
              <span className="mt-0.5 text-[10px] leading-tight app-text-faint">{hint}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
