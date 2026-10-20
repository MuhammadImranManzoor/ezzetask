import { apiFetch, getStoredToken } from './client'

export type TaskAttachmentMeta = {
  id: string
  taskId: string
  fileName: string
  mimeType: string
  sortOrder: number
  createdAt: number
}

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export async function fetchAttachmentCounts(): Promise<Map<string, number>> {
  const rows = await apiFetch<Record<string, number>>('/api/attachments/counts')
  return new Map(Object.entries(rows))
}

export async function listAttachments(taskId: string): Promise<TaskAttachmentMeta[]> {
  return apiFetch<TaskAttachmentMeta[]>(`/api/tasks/${taskId}/attachments`)
}

export async function uploadAttachment(taskId: string, file: File): Promise<TaskAttachmentMeta> {
  const form = new FormData()
  form.append('file', file)
  const token = getStoredToken()
  const headers = new Headers()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
    headers.set('X-Ezzetask-Token', token)
  }
  const res = await fetch(`${API_BASE}/api/tasks/${taskId}/attachments`, {
    method: 'POST',
    headers,
    body: form,
  })
  const text = await res.text()
  const data = text ? (JSON.parse(text) as unknown) : null
  if (!res.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data
        ? String((data as { error: string }).error)
        : res.statusText
    throw new Error(message)
  }
  return data as TaskAttachmentMeta
}

export async function deleteAttachment(taskId: string, attachmentId: string): Promise<void> {
  await apiFetch(`/api/tasks/${taskId}/attachments/${attachmentId}`, {
    method: 'DELETE',
  })
}

export async function fetchAttachmentBlob(
  taskId: string,
  attachmentId: string,
): Promise<Blob> {
  const token = getStoredToken()
  const headers = new Headers()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
    headers.set('X-Ezzetask-Token', token)
  }
  const res = await fetch(
    `${API_BASE}/api/tasks/${taskId}/attachments/${attachmentId}/file`,
    { headers },
  )
  if (!res.ok) {
    throw new Error(res.statusText || 'Could not load image')
  }
  return res.blob()
}
