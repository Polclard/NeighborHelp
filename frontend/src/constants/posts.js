const fallbackLabels = {
  ALL: 'All',
  SERVICE_REQUEST: 'Request',
  SERVICE_OFFER: 'Offer',
  REQUESTING: 'Requesting',
  SERVICE_ACCEPTED: 'Accepted',
  SERVICE_DONE: 'Done',
  CANCELLED: 'Cancelled',
  OFFERING: 'Offering',
  UNAVAILABLE: 'Unavailable',
  CLOSED: 'Closed',
  ROLE_ADMIN: 'Admin',
  ROLE_USER: 'User',
}

const translationKeys = {
  ALL: 'posts.type.all',
  SERVICE_REQUEST: 'posts.type.request',
  SERVICE_OFFER: 'posts.type.offer',
  REQUESTING: 'posts.status.requesting',
  SERVICE_ACCEPTED: 'posts.status.accepted',
  SERVICE_DONE: 'posts.status.done',
  CANCELLED: 'posts.status.cancelled',
  OFFERING: 'posts.status.offering',
  UNAVAILABLE: 'posts.status.unavailable',
  CLOSED: 'posts.status.closed',
  ROLE_ADMIN: 'posts.role.admin',
  ROLE_USER: 'posts.role.user',
}

export const reviewRatingOptions = [1, 2, 3, 4, 5]

// Characters of a post description shown in map popups before the ellipsis.
export const mapPreviewDescriptionLength = 100

// Characters of a post description shown in the map sidebar focus card.
export const focusCardDescriptionLength = 200

function translateValue(value, t) {
  const translationKey = translationKeys[value]

  if (t && translationKey) {
    return t(translationKey)
  }

  return fallbackLabels[value] ?? null
}

export function getPostTypeOptions(t) {
  return [
    { value: 'ALL', label: t ? t('posts.type.all') : 'All post types' },
    { value: 'SERVICE_REQUEST', label: t ? t('posts.type.requests') : 'Requests' },
    { value: 'SERVICE_OFFER', label: t ? t('posts.type.offers') : 'Offers' },
  ]
}

export function getPostFormTypeOptions(t) {
  return getPostTypeOptions(t).filter((option) => option.value !== 'ALL')
}

export function getBrowseStatusOptions(t) {
  return [
    { value: 'ALL', label: t ? t('posts.status.any') : 'Any status' },
    { value: 'REQUESTING', label: t ? t('posts.status.requesting') : 'Requesting' },
    { value: 'SERVICE_ACCEPTED', label: t ? t('posts.status.accepted') : 'Accepted' },
    { value: 'SERVICE_DONE', label: t ? t('posts.status.done') : 'Done' },
    { value: 'CANCELLED', label: t ? t('posts.status.cancelled') : 'Cancelled' },
    { value: 'OFFERING', label: t ? t('posts.status.offering') : 'Offering' },
    { value: 'UNAVAILABLE', label: t ? t('posts.status.unavailable') : 'Unavailable' },
    { value: 'CLOSED', label: t ? t('posts.status.closed') : 'Closed' },
  ]
}

export function getRadiusOptions(t) {
  return [
    { value: '', label: t ? t('posts.radius.none') : 'No radius filter' },
    { value: '1', label: '1 km' },
    { value: '3', label: '3 km' },
    { value: '5', label: '5 km' },
    { value: '10', label: '10 km' },
    { value: '25', label: '25 km' },
  ]
}

export function formatEnumLabel(value, t = null) {
  if (!value) {
    return t ? t('posts.enum.unknown') : 'Unknown'
  }

  const translatedValue = translateValue(value, t)
  if (translatedValue) {
    return translatedValue
  }

  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function formatPostType(postType, t = null) {
  return formatEnumLabel(postType, t)
}

export function formatPostStatus(status, t = null) {
  return formatEnumLabel(status, t)
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

export function getAvailableStatusTransitions(post, t = null) {
  if (!post) {
    return []
  }

  if (post.postType === 'SERVICE_REQUEST') {
    if (post.status === 'REQUESTING') {
      return [{ value: 'CANCELLED', label: t ? t('posts.transition.cancelRequest') : 'Cancel request' }]
    }

    if (post.status === 'SERVICE_ACCEPTED') {
      return [
        { value: 'SERVICE_DONE', label: t ? t('posts.transition.markDone') : 'Mark done' },
        { value: 'CANCELLED', label: t ? t('posts.transition.cancelRequest') : 'Cancel request' },
      ]
    }

    return []
  }

  if (post.status === 'OFFERING') {
    return [
      { value: 'UNAVAILABLE', label: t ? t('posts.transition.markUnavailable') : 'Mark unavailable' },
      { value: 'CLOSED', label: t ? t('posts.transition.closeOffer') : 'Close offer' },
    ]
  }

  if (post.status === 'UNAVAILABLE') {
    return [
      { value: 'OFFERING', label: t ? t('posts.transition.reopenOffer') : 'Reopen offer' },
      { value: 'CLOSED', label: t ? t('posts.transition.closeOffer') : 'Close offer' },
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
