export type LightFeature =
  | 'timeline'
  | 'countsByOperator'
  | 'mentions'
  | 'tags'
  | 'quickResponses'
  | 'tickets'

const DEFAULT_DISABLED_IN_LIGHT_MODE: LightFeature[] = [
  'timeline',
  'countsByOperator',
  'mentions',
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

  return {
    coreLightMode,
    disabledFeatures,
  }
})()

export const isLightFeatureDisabled = (feature: LightFeature): boolean => {
  if (!runtimeConfig.coreLightMode) return false
  return runtimeConfig.disabledFeatures.has(feature)
}
