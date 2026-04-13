export const postTypeOptions = [
  { value: 'ALL', label: 'All post types' },
  { value: 'SERVICE_REQUEST', label: 'Requests' },
  { value: 'SERVICE_OFFER', label: 'Offers' },
]

export const postFormTypeOptions = postTypeOptions.filter((option) => option.value !== 'ALL')

export const browseStatusOptions = [
  { value: 'ALL', label: 'Any status' },
  { value: 'REQUESTING', label: 'Requesting' },
  { value: 'SERVICE_ACCEPTED', label: 'Accepted' },
  { value: 'SERVICE_DONE', label: 'Done' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'OFFERING', label: 'Offering' },
  { value: 'UNAVAILABLE', label: 'Unavailable' },
  { value: 'CLOSED', label: 'Closed' },
]

export const radiusOptions = [
  { value: '', label: 'No radius filter' },
  { value: '1', label: '1 km' },
  { value: '3', label: '3 km' },
  { value: '5', label: '5 km' },
  { value: '10', label: '10 km' },
  { value: '25', label: '25 km' },
]

export const reviewRatingOptions = [1, 2, 3, 4, 5]

export function formatEnumLabel(value) {
  if (!value) {
    return 'Unknown'
  }

  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function formatPostType(postType) {
  if (postType === 'SERVICE_REQUEST') {
    return 'Request'
  }

  if (postType === 'SERVICE_OFFER') {
    return 'Offer'
  }

  return formatEnumLabel(postType)
}

export function formatPostStatus(status) {
  return formatEnumLabel(status)
}

export function getPostTone(value) {
  switch (value) {
    case 'SERVICE_REQUEST':
    case 'REQUESTING':
      return 'accent'
    case 'SERVICE_OFFER':
    case 'OFFERING':
      return 'success'
    case 'SERVICE_ACCEPTED':
      return 'info'
    case 'SERVICE_DONE':
      return 'success'
    case 'UNAVAILABLE':
      return 'warning'
    case 'CANCELLED':
    case 'CLOSED':
      return 'muted'
    default:
      return 'default'
  }
}

export function getAvailableStatusTransitions(post) {
  if (!post) {
    return []
  }

  if (post.postType === 'SERVICE_REQUEST') {
    if (post.status === 'REQUESTING') {
      return [{ value: 'CANCELLED', label: 'Cancel request' }]
    }

    if (post.status === 'SERVICE_ACCEPTED') {
      return [
        { value: 'SERVICE_DONE', label: 'Mark done' },
        { value: 'CANCELLED', label: 'Cancel request' },
      ]
    }

    return []
  }

  if (post.status === 'OFFERING') {
    return [
      { value: 'UNAVAILABLE', label: 'Mark unavailable' },
      { value: 'CLOSED', label: 'Close offer' },
    ]
  }

  if (post.status === 'UNAVAILABLE') {
    return [
      { value: 'OFFERING', label: 'Reopen offer' },
      { value: 'CLOSED', label: 'Close offer' },
    ]
  }

  return []
}

export function isEditablePost(post) {
  if (!post) {
    return false
  }

  if (post.postType === 'SERVICE_REQUEST') {
    return post.status === 'REQUESTING'
  }

  return post.status === 'OFFERING' || post.status === 'UNAVAILABLE'
}

