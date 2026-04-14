export function parseXliff(source) {
  if (!source) {
    return {}
  }

  const document = new DOMParser().parseFromString(source, 'application/xml')
  const parserError = document.querySelector('parsererror')

  if (parserError) {
    throw new Error('Failed to parse XLIFF translations')
  }

  return Array.from(document.querySelectorAll('trans-unit')).reduce((messages, unit) => {
    const id = unit.getAttribute('id')
    const target = unit.querySelector('target')?.textContent?.trim()
    const fallback = unit.querySelector('source')?.textContent?.trim()

    if (id) {
      messages[id] = target || fallback || id
    }

    return messages
  }, {})
}
