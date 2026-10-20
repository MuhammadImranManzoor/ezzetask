import { useCallback, useEffect, useState } from 'react'
import {
  deleteAttachment,
  fetchAttachmentBlob,
  listAttachments,
  uploadAttachment,
  type TaskAttachmentMeta,
} from '../api/attachments'
import { db } from '../db'

export type AttachmentPreview = TaskAttachmentMeta & { url: string }

export function useTaskAttachments(taskId: string | null) {
  const [items, setItems] = useState<AttachmentPreview[]>([])
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    if (!taskId) {
      setItems([])
      return
    }
    setLoading(true)
    try {
      await migrateLocalAttachmentsToServer(taskId)
      const metas = await listAttachments(taskId)
      const previews: AttachmentPreview[] = []
      for (const meta of metas) {
        const blob = await fetchAttachmentBlob(taskId, meta.id)
        previews.push({
          ...meta,
          url: URL.createObjectURL(blob),
        })
      }
      setItems((prev) => {
        for (const p of prev) URL.revokeObjectURL(p.url)
        return previews
      })
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    void reload()
    return () => {
      setItems((prev) => {
        for (const p of prev) URL.revokeObjectURL(p.url)
        return []
      })
    }
  }, [reload])

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!taskId) return
      const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
      if (list.length === 0) {
        throw new Error('Please choose image files only.')
      }
      for (const file of list) {
        await uploadAttachment(taskId, file)
      }
      await reload()
    },
    [taskId, reload],
  )

  const remove = useCallback(
    async (attachmentId: string) => {
      if (!taskId) return
      await deleteAttachment(taskId, attachmentId)
      setItems((prev) => {
        const next = prev.filter((p) => {
          if (p.id === attachmentId) URL.revokeObjectURL(p.url)
          return p.id !== attachmentId
        })
        return next
      })
    },
    [taskId],
  )

  return { items, loading, addFiles, remove, reload }
}

async function migrateLocalAttachmentsToServer(taskId: string): Promise<void> {
  const local = await db.attachments.where('taskId').equals(taskId).sortBy('sortOrder')
  if (local.length === 0) return
  for (const row of local) {
    const file = new File([row.blob], row.fileName, { type: row.mimeType })
    await uploadAttachment(taskId, file)
    await db.attachments.delete(row.id)
  }
}
