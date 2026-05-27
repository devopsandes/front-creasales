import { useCallback, useEffect, useRef, useState } from "react"
import { getSocket } from "../app/slices/socketSlice"
import { QuickResponse } from "../interfaces/quickResponses.interface"
import {
  getQuickResponsesCatalog,
  invalidateQuickResponsesCatalog,
  subscribeQuickResponsesCatalogInvalidation,
} from "../services/quickResponses/quickResponses.services"

type UseQuickResponsesCatalogOptions = {
  enabled: boolean
  token: string
  onAuthExpired?: (payload: any) => boolean
}

type UseQuickResponsesCatalogResult = {
  items: QuickResponse[]
  loading: boolean
  reload: (forceRefresh?: boolean) => Promise<void>
}

const SOCKET_EVENTS = [
  "quick-responses.updated",
  "quickResponses.updated",
  "quick-response.updated",
]

const getRefreshDelay = () => 250 + Math.floor(Math.random() * 2250)

export const useQuickResponsesCatalog = ({
  enabled,
  token,
  onAuthExpired,
}: UseQuickResponsesCatalogOptions): UseQuickResponsesCatalogResult => {
  const [items, setItems] = useState<QuickResponse[]>([])
  const [loading, setLoading] = useState(false)
  const refreshTimerRef = useRef<number | null>(null)
  const mountedRef = useRef(true)

  const clearRefreshTimer = () => {
    if (!refreshTimerRef.current) return
    window.clearTimeout(refreshTimerRef.current)
    refreshTimerRef.current = null
  }

  const reload = useCallback(async (forceRefresh = false) => {
    if (!enabled || !token) return
    setLoading(true)
    try {
      const resp = await getQuickResponsesCatalog(token, { forceRefresh })
      if (onAuthExpired?.(resp)) return
      const code = (resp as any)?.statusCode ?? 200
      if (code >= 400) return
      if (!mountedRef.current) return
      setItems(Array.isArray(resp.items) ? resp.items : [])
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [enabled, token, onAuthExpired])

  const scheduleReload = useCallback(() => {
    if (!enabled || !token) return
    clearRefreshTimer()
    refreshTimerRef.current = window.setTimeout(() => {
      refreshTimerRef.current = null
      reload(true).catch(() => { })
    }, getRefreshDelay())
  }, [enabled, token, reload])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      clearRefreshTimer()
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      setItems([])
      setLoading(false)
      clearRefreshTimer()
      return
    }
    reload(false).catch(() => { })
  }, [enabled, reload])

  useEffect(() => {
    if (!enabled || !token) return
    return subscribeQuickResponsesCatalogInvalidation(() => {
      reload(false).catch(() => { })
    })
  }, [enabled, token, reload])

  useEffect(() => {
    if (!enabled || !token) return
    const socket = getSocket()
    if (!socket) return
    const handleUpdate = () => {
      invalidateQuickResponsesCatalog(token, { notify: false })
      scheduleReload()
    }
    SOCKET_EVENTS.forEach((eventName) => socket.on(eventName, handleUpdate))
    return () => {
      SOCKET_EVENTS.forEach((eventName) => socket.off(eventName, handleUpdate))
    }
  }, [enabled, token, scheduleReload])

  return { items, loading, reload }
}
