import { Link } from 'react-router-dom'
import {
  formatPostStatus,
  formatPostType,
  getPostTone,
  isEditablePost,
} from '../../constants/posts.js'
import { formatShortDate } from '../../utils/formatDateTime.js'
import AvatarBadge from '../ui/AvatarBadge.jsx'
import StatusBadge from '../ui/StatusBadge.jsx'
import styles from './PostCard.module.css'

function PostCard({ post, ownerProfile = null, distanceKm = null, isSelected = false, onSelect = null, showOwner = true }) {
  const ownerName = ownerProfile
    ? `${ownerProfile.firstName} ${ownerProfile.lastName}`
    : 'Neighbor'

  return (
    <article
      className={isSelected ? `${styles.card} ${styles.selected}` : styles.card}
      onClick={onSelect ? () => onSelect(post) : undefined}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={
        onSelect
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelect(post)
              }
            }
          : undefined
      }
    >
      <div className={styles.header}>
        <div className={styles.badges}>
          <StatusBadge value={post.postType} label={formatPostType(post.postType)} tone={getPostTone(post.postType)} />
          <StatusBadge value={post.status} label={formatPostStatus(post.status)} />
        </div>
        <span className={styles.date}>{formatShortDate(post.createdAt)}</span>
      </div>

      <h3 className={styles.title}>{post.title}</h3>
      <p className={styles.description}>{post.description}</p>

      <dl className={styles.meta}>
        <div>
          <dt>Category</dt>
          <dd>{post.category}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>{post.addressLabel || `${post.latitude}, ${post.longitude}`}</dd>
        </div>
        {distanceKm !== null ? (
          <div>
            <dt>Distance</dt>
            <dd>{distanceKm.toFixed(1)} km away</dd>
          </div>
        ) : null}
      </dl>

      {showOwner ? (
        <div className={styles.owner}>
          <AvatarBadge
            src={ownerProfile?.profilePicture}
            name={ownerName}
            size="small"
          />
          <div>
            <p className={styles.ownerName}>{ownerName}</p>
            <p className={styles.ownerMeta}>
              {ownerProfile?.averageRating ? `${ownerProfile.averageRating} stars` : 'New neighbor'} ·{' '}
              {ownerProfile?.reviewCount ?? 0} reviews
            </p>
          </div>
        </div>
      ) : null}

      <div className={styles.actions}>
        <Link className={styles.primaryAction} to={`/posts/${post.id}`}>
          View details
        </Link>
        {isEditablePost(post) ? (
          <Link className={styles.secondaryAction} to={`/posts/${post.id}/edit`}>
            Edit
          </Link>
        ) : null}
      </div>
    </article>
  )
}

export default PostCard

