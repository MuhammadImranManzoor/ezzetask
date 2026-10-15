import { Plus } from 'lucide-react'
import { useState } from 'react'

type Props = {
  disabled?: boolean
  onAdd: (title: string) => void
  onOpenFullForm: () => void
}

export function TaskQuickAdd({ disabled, onAdd, onOpenFullForm }: Props) {
  const [title, setTitle] = useState('')

  function submit() {
    const trimmed = title.trim()
    if (!trimmed || disabled) return
    onAdd(trimmed)
    setTitle('')
  }

  return (
    <div className="flex gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border app-border bg-[var(--color-surface)] px-3 py-2 focus-within:app-accent-ring">
        <Plus className="h-4 w-4 shrink-0 app-text-muted" aria-hidden />
        <input
          value={title}
          disabled={disabled}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Quick add — type and press Enter"
          className="min-w-0 flex-1 bg-transparent text-sm app-text outline-none placeholder:app-text-faint disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            }
          }}
        />
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onOpenFullForm}
        className="shrink-0 rounded-xl border px-3 py-2 text-xs font-medium app-border app-text-muted app-bg-hover hover:app-text disabled:opacity-50"
      >
        More options
      </button>
    </div>
  )
}
