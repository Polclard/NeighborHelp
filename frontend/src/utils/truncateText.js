const DEFAULT_LIMIT = 100

// Null-safe truncation for user supplied text. Missing or blank input returns an
// empty string so callers can keep falling back with `||`.
export function truncateText(value, limit = DEFAULT_LIMIT) {
  const text = typeof value === 'string' ? value.trim() : ''

  if (!text || text.length <= limit) {
    return text
  }

  return `${text.slice(0, limit).trimEnd()}...`
}
