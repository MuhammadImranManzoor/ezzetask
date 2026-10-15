import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../lib/theme'
import { cn, GhostButton } from './ui'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <GhostButton
      type="button"
      className={cn('w-full justify-start gap-2', className)}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {isDark ? 'Light mode' : 'Dark mode'}
    </GhostButton>
  )
}
