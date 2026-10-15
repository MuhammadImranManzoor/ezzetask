import { useEffect, useState } from 'react'
import { PROJECT_COLORS } from '../lib/constants'
import type { Project } from '../types'
import { GhostButton, Modal, PrimaryButton } from './ui'

type Props = {
  open: boolean
  editing: Project | null
  onClose: () => void
  onSave: (name: string, colorIndex: number) => void
}

export function ProjectModal({ open, editing, onClose, onSave }: Props) {
  const [name, setName] = useState('')
  const [colorIndex, setColorIndex] = useState(2)

  useEffect(() => {
    if (!open) return
    setName(editing?.name ?? '')
    setColorIndex(editing?.colorIndex ?? 2)
  }, [open, editing])

  const trimmed = name.trim()
  const canSave = trimmed.length > 0

  return (
    <Modal
      open={open}
      title={editing ? 'Edit project' : 'New project'}
      onClose={onClose}
    >
      <label className="app-label mb-4 block">
        Name
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project name"
          className="app-input mt-2 w-full"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canSave) onSave(trimmed, colorIndex)
          }}
        />
      </label>

      <p className="app-label mb-2">Color</p>
      <div className="mb-6 grid grid-cols-8 gap-2">
        {PROJECT_COLORS.map((color, index) => (
          <button
            key={color}
            type="button"
            aria-label={`Color ${index + 1}`}
            className="flex h-8 w-8 items-center justify-center rounded-full ring-2 transition hover:scale-105"
            style={{
              backgroundColor: color,
              boxShadow: colorIndex === index ? `0 0 0 2px ${color}` : undefined,
            }}
            onClick={() => setColorIndex(index)}
          >
            {colorIndex === index && (
              <span className="text-xs font-bold text-white drop-shadow">✓</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <GhostButton onClick={onClose}>Cancel</GhostButton>
        <PrimaryButton
          disabled={!canSave}
          onClick={() => onSave(trimmed, colorIndex)}
        >
          {editing ? 'Save' : 'Create'}
        </PrimaryButton>
      </div>
    </Modal>
  )
}
