import { useCallback, useEffect, useRef } from "react"
import { useDispatch, useSelector } from "react-redux"
import { jwtDecode } from "jwt-decode"
import { toast } from "react-toastify"
import { RootState } from "../app/store"
import { getSocket } from "../app/slices/socketSlice"
import { bumpMentionsRefreshNonce, openSessionExpired, setMentionUnreadCount } from "../app/slices/actionSlice"
import { getMentionChats, getMentionsUnreadCount } from "../services/mentions/mentions.services"

export const useMentionsSync = () => {
  const dispatch = useDispatch()
  const socketConnected = useSelector((state: RootState) => state.socket.isConnected)
  const authUserId = useSelector((state: RootState) => state.auth.user?.id)
  const authEmpresaId = useSelector((state: RootState) => state.auth.empresa?.id)
  const mentionsRefreshNonce = useSelector((state: RootState) => state.action.mentionsRefreshNonce)

  const inFlightRef = useRef(false)
  const lastFetchAtRef = useRef(0)
  const scheduleRef = useRef<number | null>(null)
  const mentionAudioRef = useRef(new Audio('/audio/mencion.mp3'))
  const unreadControllerRef = useRef<AbortController | null>(null)
  const chatsControllerRef = useRef<AbortController | null>(null)

  const refreshMentionCount = useCallback(async (source: "bootstrap" | "socket" | "nonce" = "bootstrap") => {
    const token = localStorage.getItem("token") || ""
    if (!token) return
    if (inFlightRef.current) return
    const now = Date.now()
    if (now - lastFetchAtRef.current < 2500) return
    inFlightRef.current = true
    lastFetchAtRef.current = now
    try {
      unreadControllerRef.current?.abort()
      chatsControllerRef.current?.abort()
      unreadControllerRef.current = new AbortController()
      chatsControllerRef.current = new AbortController()
      const [countResp, chatsResp] = await Promise.all([
        getMentionsUnreadCount(token, { signal: unreadControllerRef.current.signal }),
        getMentionChats(token, { unreadOnly: true, page: 1, limit: 200 }, { signal: chatsControllerRef.current.signal }),
      ])
      if ((countResp as any)?.statusCode === 401 || (chatsResp as any)?.statusCode === 401) {
        dispatch(openSessionExpired())
        return
      }
      const items = Array.isArray((chatsResp as any)?.items) ? (chatsResp as any).items : []
      if (items.length === 0) {
        dispatch(setMentionUnreadCount(0))
      } else {
        dispatch(setMentionUnreadCount((countResp as any)?.count ?? 0))
      }
      if (source === "socket") {
        dispatch(bumpMentionsRefreshNonce())
      }
    } finally {
      unreadControllerRef.current = null
      chatsControllerRef.current = null
      inFlightRef.current = false
    }
  }, [dispatch])

  const scheduleRefresh = useCallback((source: "bootstrap" | "socket" | "nonce" = "bootstrap") => {
    if (scheduleRef.current) {
      window.clearTimeout(scheduleRef.current)
      scheduleRef.current = null
    }
    scheduleRef.current = window.setTimeout(() => {
      scheduleRef.current = null
      refreshMentionCount(source).catch(() => {
        inFlightRef.current = false
      })
    }, 300)
  }, [refreshMentionCount])

  useEffect(() => {
    scheduleRefresh("bootstrap")
    return () => {
      if (scheduleRef.current) {
        window.clearTimeout(scheduleRef.current)
        scheduleRef.current = null
      }
      unreadControllerRef.current?.abort()
      chatsControllerRef.current?.abort()
    }
  }, [scheduleRefresh, authUserId, authEmpresaId, socketConnected])

  useEffect(() => {
    if (!mentionsRefreshNonce) return
    scheduleRefresh("nonce")
  }, [mentionsRefreshNonce, scheduleRefresh])

  useEffect(() => {
    const token = localStorage.getItem("token") || ""
    const socket = getSocket()
    let myUserId = localStorage.getItem("userId") || ""
    if (!myUserId && token) {
      try {
        myUserId = jwtDecode<{ id?: string }>(token)?.id ?? ""
      } catch {
        myUserId = ""
      }
    }
    if (!token || !myUserId || !socket || !socketConnected) return
    const eventName = `mention-${myUserId}`
    const handler = () => {
      toast.info('Te mencionaron en un chat')
      try {
        const audio = mentionAudioRef.current
        audio.currentTime = 0
        audio.playbackRate = 1.2
        audio.play().catch(() => { })
      } catch { }
      scheduleRefresh("socket")
    }
    socket.on(eventName, handler)
    return () => {
      socket.off(eventName, handler)
    }
  }, [socketConnected, scheduleRefresh])
}

