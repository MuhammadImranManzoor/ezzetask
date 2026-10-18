import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'

const dataDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

const dbPath = process.env.DB_PATH ?? path.join(dataDir, 'ezzetask.sqlite')
export const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function initSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color_index INTEGER NOT NULL DEFAULT 0,
      team TEXT NOT NULL DEFAULT 'other' CHECK (team IN ('frontend', 'backend', 'other')),
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
      member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color_index INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      task_description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL CHECK (status IN ('todo', 'inProgress', 'done')),
      assignee_id TEXT REFERENCES members(id) ON DELETE SET NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      completed_at INTEGER,
      deadline INTEGER,
      notification_enabled INTEGER NOT NULL DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed_at);
  `)
}

export type DbMember = {
  id: string
  name: string
  color_index: number
  team: 'frontend' | 'backend' | 'other'
  created_at: number
}

export type DbUser = {
  id: string
  email: string
  password_hash: string
  role: 'admin' | 'member'
  member_id: string | null
  created_at: number
}

export type DbProject = {
  id: string
  name: string
  color_index: number
  sort_order: number
  created_at: number
}

export type DbTask = {
  id: string
  project_id: string
  title: string
  task_description: string
  status: 'todo' | 'inProgress' | 'done'
  assignee_id: string | null
  created_at: number
  updated_at: number
  completed_at: number | null
  deadline: number | null
  notification_enabled: number
}
