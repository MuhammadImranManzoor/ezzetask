import { useCallback, useEffect, useState } from 'react'
import { fetchAttachmentCounts } from '../api/attachments'
import { useAuth } from '../context/AuthContext'

export function useAttachmentCounts() {
  const { user } = useAuth()
  const [counts, setCounts] = useState<Map<string, number>>(() => new Map())

  const reload = useCallback(async () => {
    if (!user) {
      setCounts(new Map())
      return
    }
    try {
      setCounts(await fetchAttachmentCounts())
    } catch {
      /* keep previous counts on transient errors */
    }
  }, [user])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    const onRefresh = () => void reload()
    window.addEventListener('ezzetask:data-refreshed', onRefresh)
    return () => window.removeEventListener('ezzetask:data-refreshed', onRefresh)
  }, [reload])

  const bump = useCallback((taskId: string, delta: number) => {
    setCounts((prev) => {
      const next = new Map(prev)
      const c = (next.get(taskId) ?? 0) + delta
      if (c <= 0) next.delete(taskId)
      else next.set(taskId, c)
      return next
    })
  }, [])

  return { counts, reload, bump }
}
