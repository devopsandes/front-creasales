import { useCallback, useEffect, useRef } from "react"
import { useDispatch, useSelector } from "react-redux"
import { RootState } from "../app/store"
import { isLightFeatureDisabled } from "../config/runtimeConfig"
import { bumpMentionsRefreshNonce, openSessionExpired, setMentionChatIds, setMentionUnreadCount } from "../app/slices/actionSlice"
import { getMentionsUnreadCount, getMisMenciones } from "../services/mentions/mentions.services"
import { getSocket } from "../app/slices/socketSlice"
import { jwtDecode } from "jwt-decode"

export const useMentionsSync = () => {
  const mentionsDisabled = isLightFeatureDisabled('mentions')
  const dispatch = useDispatch()
  const token = localStorage.getItem('token') || ''
  const mentionsRefreshNonce = useSelector((state: RootState) => state.action.mentionsRefreshNonce)
  const socketConnected = useSelector((state: RootState) => state.socket.isConnected)
  const mentionAudioRef = useRef(new Audio('/audio/mencion.mp3'))
  const unreadControllerRef = useRef<AbortController | null>(null)
  const chatsControllerRef = useRef<AbortController | null>(null)

  const myUserId = (() => {
    try { return token ? jwtDecode<{ id?: string }>(token)?.id ?? null : null }
    catch { return null }
  })()

  const refreshMentions = useCallback(async (source: "bootstrap" | "socket" | "nonce" = "bootstrap") => {
    if (mentionsDisabled) return
    if (!token) return

    unreadControllerRef.current?.abort()
    chatsControllerRef.current?.abort()
    unreadControllerRef.current = new AbortController()
    chatsControllerRef.current = new AbortController()

    try {
      const [countResp, mentionsResp] = await Promise.all([
        getMentionsUnreadCount(token, { signal: unreadControllerRef.current.signal }),
        getMisMenciones(token, { page: 1, limit: 30 }, { signal: chatsControllerRef.current.signal }),
      ])

      if ((countResp as any)?.statusCode === 401 || (mentionsResp as any)?.statusCode === 401) {
        dispatch(openSessionExpired())
        return
      }

      const items = Array.isArray((mentionsResp as any)?.items) ? (mentionsResp as any).items : []
      
      // Guardamos las menciones completas en Redux
      dispatch(setMentionChatIds(items))
      dispatch(setMentionUnreadCount((countResp as any)?.count ?? 0))

      if (source === 'socket') {
        try {
          const audio = mentionAudioRef.current
          audio.currentTime = 0
          await audio.play()
        } catch { }
        dispatch(bumpMentionsRefreshNonce())
      }
    } catch (e: any) {
      if (e?.name === 'AbortError' || e?.code === 'ERR_CANCELED') return
    }
  }, [dispatch, mentionsDisabled, token])

  const scheduleRefresh = useCallback((source: "bootstrap" | "socket" | "nonce") => {
    refreshMentions(source).catch(() => {})
  }, [refreshMentions])

  // Bootstrap
  useEffect(() => {
    if (mentionsDisabled) return
    scheduleRefresh("bootstrap")
  }, [scheduleRefresh, mentionsDisabled])

  // Limpiar si se deshabilita
  useEffect(() => {
    if (!mentionsDisabled) return
    dispatch(setMentionUnreadCount(0))
    dispatch(setMentionChatIds([]))
  }, [mentionsDisabled, dispatch])

  // Re-sync cuando el socket reconecta
  useEffect(() => {
    if (mentionsDisabled) return
    if (!socketConnected) return
    scheduleRefresh("bootstrap")
  }, [scheduleRefresh, socketConnected, mentionsDisabled])

  // Re-sync cuando se dispara el nonce
  useEffect(() => {
    if (mentionsDisabled) return
    if (!mentionsRefreshNonce) return
    scheduleRefresh("nonce")
  }, [mentionsRefreshNonce, scheduleRefresh, mentionsDisabled])

  // Escuchar evento socket de nueva mención
  useEffect(() => {
    if (mentionsDisabled) return
    if (!myUserId) return
    const socket = getSocket()
    if (!socket) return

    const eventName = `mention-${myUserId}`
    const handleMention = (_payload: any) => {
      scheduleRefresh("socket")
    }

    socket.on(eventName, handleMention)
    return () => { socket.off(eventName, handleMention) }
  }, [socketConnected, scheduleRefresh, mentionsDisabled, myUserId])

  useEffect(() => {
    return () => {
      unreadControllerRef.current?.abort()
      chatsControllerRef.current?.abort()
    }
  }, [])
}