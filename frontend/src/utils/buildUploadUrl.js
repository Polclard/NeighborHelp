import { API_BASE_URL } from '../constants/env.js'

const CLOUDINARY_UPLOAD_MARKER = '/image/upload/'

/**
 * Pixel sizes the UI actually renders at. Keeping them here means the
 * requested image matches the CSS box instead of shipping a full-size upload
 * to paint a 40px circle.
 *
 * `dpr_2.0` keeps them crisp on retina; `f_auto,q_auto` lets Cloudinary pick
 * the format and compression.
 */
const AVATAR_PIXELS = { small: 40, medium: 56, large: 88 }
const GALLERY_PIXELS = 440
const CHAT_IMAGE_PIXELS = { width: 640, height: 560 }

export function avatarTransform(size = 'medium') {
  const pixels = AVATAR_PIXELS[size] ?? AVATAR_PIXELS.medium
  return `c_fill,g_face,w_${pixels},h_${pixels},dpr_2.0,f_auto,q_auto`
}

export function galleryTransform() {
  return `c_fill,w_${GALLERY_PIXELS},h_${GALLERY_PIXELS},f_auto,q_auto`
}

/** `c_limit` keeps the aspect ratio and never upscales a small attachment. */
export function chatImageTransform() {
  return `c_limit,w_${CHAT_IMAGE_PIXELS.width},h_${CHAT_IMAGE_PIXELS.height},f_auto,q_auto`
}

/**
 * Builds a displayable URL for a stored image.
 *
 * Local disk storage hands back a relative `/uploads/...` path that needs the
 * API origin prefixed. Cloudinary hands back an absolute delivery URL, which
 * is returned as-is apart from an optional transformation segment.
 *
 * `transform` is ignored for non-Cloudinary URLs, so local development keeps
 * working without a Cloudinary account.
 */
export function buildUploadUrl(path, transform = null) {
  if (!path) {
    return null
  }

  const isAbsolute = path.startsWith('http://') || path.startsWith('https://')
  const url = isAbsolute ? path : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`

  if (!transform) {
    return url
  }

  const markerIndex = url.indexOf(CLOUDINARY_UPLOAD_MARKER)
  if (markerIndex < 0) {
    return url
  }

  const insertAt = markerIndex + CLOUDINARY_UPLOAD_MARKER.length
  return `${url.slice(0, insertAt)}${transform}/${url.slice(insertAt)}`
}
