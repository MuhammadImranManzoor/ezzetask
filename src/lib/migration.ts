import { db } from '../db'
import { INBOX_PROJECT_NAME } from './constants'
import type { Project } from '../types'

export async function ensureSeedData(): Promise<void> {
  const count = await db.projects.count()
  if (count > 0) return

  const inbox: Project = {
    id: crypto.randomUUID(),
    name: INBOX_PROJECT_NAME,
    colorIndex: 0,
    createdAt: Date.now(),
    sortOrder: 0,
  }
  await db.projects.add(inbox)
}

export async function getFirstProjectId(): Promise<string | null> {
  const first = await db.projects.orderBy('sortOrder').first()
  return first?.id ?? null
}
