import { format, formatDistanceToNow, isToday as fnsIsToday } from 'date-fns'

export function absolute(date: Date): string {
  return format(date, 'MMM d, yyyy · h:mm a')
}

export function relative(to: Date): string {
  return formatDistanceToNow(to, { addSuffix: true })
}

export function isToday(date: Date): boolean {
  return fnsIsToday(date)
}

export function isOverdue(date: Date, now = new Date()): boolean {
  return date.getTime() < now.getTime()
}
