let emptyDateLabel = 'No date'

function createShortDateFormatter(locale) {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function createFullDateTimeFormatter(locale) {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

let shortDateFormatter = createShortDateFormatter('en-US')
let fullDateTimeFormatter = createFullDateTimeFormatter('en-US')

export function setDateTimeLocale(locale, nextEmptyDateLabel = emptyDateLabel) {
  shortDateFormatter = createShortDateFormatter(locale)
  fullDateTimeFormatter = createFullDateTimeFormatter(locale)
  emptyDateLabel = nextEmptyDateLabel
}

export function formatShortDate(value) {
  if (!value) {
    return emptyDateLabel
  }

  return shortDateFormatter.format(new Date(value))
}

export function formatDateTime(value) {
  if (!value) {
    return emptyDateLabel
  }

  return fullDateTimeFormatter.format(new Date(value))
}
