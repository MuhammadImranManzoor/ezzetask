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
  {
    status: 'todo',
    Icon: Circle,
    tone: 'todo',
    hint: 'Not started',
  },
  {
    status: 'inProgress',
    Icon: Loader2,
    tone: 'progress',
    hint: 'In progress',
  },
  {
    status: 'done',
    Icon: CheckCircle2,
    tone: 'done',
    hint: 'Completed',
  },
]

type Props = {
  value: TaskStatus
  onChange: (status: TaskStatus) => void
  size?: 'default' | 'large'
  showHints?: boolean
}

export function StatusPicker({
  value,
  onChange,
  size = 'default',
  showHints = false,
}: Props) {
  const large = size === 'large'

  return (
    <div
      className={cn('grid grid-cols-3 gap-2', large && 'gap-3')}
      role="radiogroup"
      aria-label="Task status"
    >
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
              'app-status-picker flex flex-col items-center rounded-xl text-center',
              `app-status-picker--${tone}`,
              selected && 'app-status-picker--selected shadow-sm',
              large ? 'px-3 py-4' : 'px-2 py-2.5',
            )}
          >
            <Icon
              className={cn(
                'app-status-picker-icon shrink-0',
                large ? 'mb-2 h-5 w-5' : 'mb-1 h-4 w-4',
                status === 'inProgress' && selected && 'animate-spin',
              )}
            />
            <span
              className={cn(
                'app-status-picker-label font-semibold',
                large ? 'text-sm' : 'text-xs',
                !selected && 'app-text-muted',
              )}
            >
              {TASK_STATUS_LABEL[status]}
            </span>
            {showHints && (
              <span
                className={cn(
                  'mt-1 text-[10px] leading-tight',
                  selected ? 'opacity-80' : 'app-text-faint',
                )}
              >
                {hint}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
