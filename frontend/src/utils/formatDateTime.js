const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const fullDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

export function formatShortDate(value) {
  if (!value) {
    return 'No date'
  }

  return shortDateFormatter.format(new Date(value))
}

export function formatDateTime(value) {
  if (!value) {
    return 'No date'
  }

  return fullDateTimeFormatter.format(new Date(value))
}

