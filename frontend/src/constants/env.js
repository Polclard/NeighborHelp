export const APP_NAME = 'NeighborHelp'

function readEnv(key, fallback) {
  const value = import.meta.env[key]
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

export const API_BASE_URL = readEnv('VITE_API_BASE_URL', 'http://localhost:8080')
export const WS_BASE_URL = readEnv('VITE_WS_BASE_URL', API_BASE_URL)
