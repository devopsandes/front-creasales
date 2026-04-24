import { useEffect, useMemo, useState } from "react"

const LEADER_LOCK_KEY = "front-creasales:leader-tab-lock"
const TAB_ID_KEY = "front-creasales:tab-id"
const HEARTBEAT_MS = 4000
const LOCK_TTL_MS = 12000

type LeaderLock = {
  tabId: string
  expiresAt: number
}

const parseLock = (raw: string | null): LeaderLock | null => {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return null
    if (typeof parsed.tabId !== "string" || typeof parsed.expiresAt !== "number") return null
    return parsed as LeaderLock
  } catch {
    return null
  }
}

export const useLeaderTab = () => {
  const tabId = useMemo(
    () => {
      const existing = sessionStorage.getItem(TAB_ID_KEY)
      if (existing) return existing
      const created = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      sessionStorage.setItem(TAB_ID_KEY, created)
      return created
    },
    []
  )
  const [isLeader, setIsLeader] = useState(false)

  useEffect(() => {
    const writeLock = () => {
      const lock: LeaderLock = { tabId, expiresAt: Date.now() + LOCK_TTL_MS }
      localStorage.setItem(LEADER_LOCK_KEY, JSON.stringify(lock))
      setIsLeader(true)
    }

    const evaluateLeadership = () => {
      const current = parseLock(localStorage.getItem(LEADER_LOCK_KEY))
      const now = Date.now()

      if (!current || current.expiresAt <= now || current.tabId === tabId) {
        writeLock()
        return
      }

      setIsLeader(false)
    }

    evaluateLeadership()
    const heartbeat = window.setInterval(() => {
      if (isLeader) writeLock()
      else evaluateLeadership()
    }, HEARTBEAT_MS)

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== LEADER_LOCK_KEY) return
      evaluateLeadership()
    }

    const handleBeforeUnload = () => {
      const current = parseLock(localStorage.getItem(LEADER_LOCK_KEY))
      if (current?.tabId === tabId) {
        localStorage.removeItem(LEADER_LOCK_KEY)
      }
    }

    window.addEventListener("storage", handleStorage)
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.clearInterval(heartbeat)
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      handleBeforeUnload()
    }
  }, [isLeader, tabId])

  return { isLeader, tabId }
}

