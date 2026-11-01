export const FEATURE_KEYS = {
  openButton: 'watchly-feature-open-button',
  shortsSpeed: 'watchly-feature-shorts-speed',
} as const

export type FeatureKey = (typeof FEATURE_KEYS)[keyof typeof FEATURE_KEYS]

export interface FeatureSettings {
  [FEATURE_KEYS.openButton]: boolean
  [FEATURE_KEYS.shortsSpeed]: boolean
}

const DEFAULTS: FeatureSettings = {
  [FEATURE_KEYS.openButton]: true,
  [FEATURE_KEYS.shortsSpeed]: true,
}

export function getFeatureSettings(): Promise<FeatureSettings> {
  return new Promise(resolve => {
    try {
      chrome.storage.local.get(Object.values(FEATURE_KEYS), result => {
        void chrome.runtime.lastError
        resolve({
          [FEATURE_KEYS.openButton]: result[FEATURE_KEYS.openButton] ?? DEFAULTS[FEATURE_KEYS.openButton],
          [FEATURE_KEYS.shortsSpeed]: result[FEATURE_KEYS.shortsSpeed] ?? DEFAULTS[FEATURE_KEYS.shortsSpeed],
        })
      })
    } catch {
      resolve({ ...DEFAULTS })
    }
  })
}

export function setFeatureSetting(key: FeatureKey, enabled: boolean): Promise<void> {
  return new Promise(resolve => {
    try {
      chrome.storage.local.set({ [key]: enabled }, () => {
        void chrome.runtime.lastError
        resolve()
      })
    } catch {
      resolve()
    }
  })
}
