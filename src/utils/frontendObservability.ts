type EndpointStats = {
  hits: number[]
  aborts: number[]
}

const endpointStats = new Map<string, EndpointStats>()
const openChatSamples: number[] = []
let socketReconnectEvents: number[] = []

const now = () => Date.now()

const normalizeEndpoint = (url?: string) => {
  if (!url) return "unknown"
  try {
    const normalized = url.replace(/^https?:\/\/[^/]+/i, "")
    return normalized.split("?")[0] || "unknown"
  } catch {
    return url
  }
}

const percentile = (values: number[], p: number) => {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))
  return sorted[idx]
}

export const recordHttpRequest = (url?: string, aborted: boolean = false) => {
  const endpoint = normalizeEndpoint(url)
  const current = endpointStats.get(endpoint) ?? { hits: [], aborts: [] }
  const ts = now()

  current.hits.push(ts)
  current.hits = current.hits.filter((x) => ts - x <= 60000)

  if (aborted) {
    current.aborts.push(ts)
    current.aborts = current.aborts.filter((x) => ts - x <= 60000)
  }

  endpointStats.set(endpoint, current)

  const rpm = current.hits.length
  if (endpoint.includes("/chats/counts") && rpm > 60) {
    console.warn("[obs] counts high rpm", { endpoint, rpm })
  }
}

export const recordOpenChatTiming = (ms: number) => {
  if (!Number.isFinite(ms) || ms <= 0) return
  openChatSamples.push(ms)
  if (openChatSamples.length > 200) openChatSamples.shift()

  const p50 = percentile(openChatSamples, 50)
  const p95 = percentile(openChatSamples, 95)
  if (p95 > 3000) {
    console.warn("[obs] openChat latency high", { p50, p95, samples: openChatSamples.length })
  } else {
    console.info("[obs] openChat latency", { p50, p95, samples: openChatSamples.length })
  }
}

export const recordSocketReconnect = () => {
  const ts = now()
  socketReconnectEvents.push(ts)
  socketReconnectEvents = socketReconnectEvents.filter((x) => ts - x <= 5 * 60 * 1000)
  const reconnectsIn5m = socketReconnectEvents.length
  if (reconnectsIn5m > 10) {
    console.warn("[obs] socket reconnect storm", { reconnectsIn5m })
  }
}

