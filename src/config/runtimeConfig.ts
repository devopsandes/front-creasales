export type LightFeature =
  | 'timeline'
  | 'countsByOperator'
  | 'mentions'
  | 'tags'
  | 'quickResponses'
  | 'tickets'

export type TimelineEventsSource = 'legacy' | 'socket_cache' | 'backend_events'

const DEFAULT_DISABLED_IN_LIGHT_MODE: LightFeature[] = [
  'countsByOperator',
  /*  'mentions', */
  'tags',
  'quickResponses',
  'tickets',
]

const normalizeFeature = (raw: string): LightFeature | null => {
  const value = `${raw || ''}`.trim().toLowerCase()
  if (value === 'timeline') return 'timeline'
  if (value === 'countsbyoperator' || value === 'counts-by-operator') return 'countsByOperator'
  if (value === 'mentions') return 'mentions'
  if (value === 'tags') return 'tags'
  if (value === 'quickresponses' || value === 'quick-responses') return 'quickResponses'
  if (value === 'tickets') return 'tickets'
  return null
}

const parseBooleanFlag = (raw: string | boolean | undefined): boolean => {
  if (typeof raw === 'boolean') return raw
  const value = `${raw ?? ''}`.trim().toLowerCase()
  return value === '1' || value === 'true' || value === 'yes' || value === 'on'
}

const parseTimelineEventsSource = (raw: string | undefined): TimelineEventsSource => {
  const value = `${raw ?? ''}`.trim().toLowerCase()
  if (value === 'legacy') return 'legacy'
  if (value === 'backend_events' || value === 'backend-events') return 'backend_events'
  if (value === 'socket_cache' || value === 'socket-cache') return 'socket_cache'
  return 'socket_cache'
}

const parseDisabledFeatures = (raw: string | undefined): Set<LightFeature> => {
  const source = `${raw ?? ''}`.trim()
  const fromEnv = source.length
    ? source
      .split(',')
      .map((item) => normalizeFeature(item))
      .filter((item): item is LightFeature => Boolean(item))
    : []

  const list = fromEnv.length ? fromEnv : DEFAULT_DISABLED_IN_LIGHT_MODE
  return new Set<LightFeature>(list)
}

export const runtimeConfig = (() => {
  const coreLightMode = parseBooleanFlag(import.meta.env.VITE_CORE_LIGHT_MODE)
  const disabledFeatures = coreLightMode
    ? parseDisabledFeatures(import.meta.env.VITE_CORE_LIGHT_DISABLED_FEATURES)
    : new Set<LightFeature>()
  const timelineEventsSource = parseTimelineEventsSource(import.meta.env.VITE_TIMELINE_EVENTS_SOURCE)

  return {
    coreLightMode,
    disabledFeatures,
    timelineEventsSource,
  }
})()

export const isLightFeatureDisabled = (feature: LightFeature): boolean => {
  if (!runtimeConfig.coreLightMode) return false
  return runtimeConfig.disabledFeatures.has(feature)
}

export const getTimelineEventsSource = (): TimelineEventsSource => runtimeConfig.timelineEventsSource
