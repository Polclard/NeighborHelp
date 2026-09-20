import { avatarTransform, buildUploadUrl } from '../../utils/buildUploadUrl.js'
import styles from './AvatarBadge.module.css'

function AvatarBadge({ src, name, size = 'medium' }) {
  const imageUrl = buildUploadUrl(src, avatarTransform(size))
  const initials = createInitials(name)

  if (imageUrl) {
    return <img className={`${styles.avatar} ${styles[size]}`} src={imageUrl} alt={name ?? 'User avatar'} />
  }

  return (
    <span className={`${styles.avatar} ${styles[size]} ${styles.fallback}`} aria-label={name ?? 'User avatar'}>
      {initials}
    </span>
  )
}

function createInitials(name) {
  if (!name) {
    return 'NH'
  }

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export default AvatarBadge

