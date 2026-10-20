import clsx from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useModalFocusTrap } from '../hooks/useModalFocusTrap'

export function cn(...parts: Array<string | false | null | undefined>) {
  return clsx(parts)
}

export function PrimaryButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn('app-btn-primary', className)}
      {...props}
    />
  )
}

export function GhostButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        'app-text-muted app-bg-hover inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition hover:text-[var(--color-text)] disabled:opacity-45',
        className,
      )}
      {...props}
    />
  )
}

export function CardSection({
  title,
  icon,
  children,
}: {
  title: string
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border bg-[var(--color-surface-raised)] p-4 app-border">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold app-text">
        {icon && <span className="app-icon">{icon}</span>}
        {title}
      </div>
      {children}
    </section>
  )
}

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const panelRef = useModalFocusTrap(open, onClose)
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ background: 'var(--color-backdrop)' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        className="w-full max-w-md rounded-2xl border bg-[var(--color-surface-overlay)] p-6 shadow-xl app-border"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <h2 className="mb-5 text-xl font-bold tracking-tight app-text">{title}</h2>
        {children}
      </div>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl app-bg-subtle app-icon">
        {icon}
      </div>
      <h3 className="text-lg font-semibold app-text">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed app-text-muted">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
