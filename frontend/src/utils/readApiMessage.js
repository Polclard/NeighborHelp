export function readApiMessage(error, fallback = 'Request failed') {
  const validationErrors = error?.response?.data?.validationErrors

  if (validationErrors && Object.keys(validationErrors).length > 0) {
    return Object.values(validationErrors)[0]
  }

  return error?.response?.data?.message ?? fallback
}

export function buildApiErrorPayload(error, fallback = 'Request failed') {
  return {
    message: readApiMessage(error, fallback),
    validationErrors: error?.response?.data?.validationErrors ?? {},
  }
}

