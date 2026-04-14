import { Link } from 'react-router-dom'
import {
  formatPostStatus,
  formatPostType,
  getPostTone,
  isEditablePost,
} from '../../constants/posts.js'
import { useI18n } from '../../i18n/useI18n.js'
import { formatShortDate } from '../../utils/formatDateTime.js'
import AvatarBadge from '../ui/AvatarBadge.jsx'
import StatusBadge from '../ui/StatusBadge.jsx'
import styles from './PostCard.module.css'

function PostCard({ post, ownerProfile = null, distanceKm = null, isSelected = false, onSelect = null, showOwner = true }) {
  const { t } = useI18n()
  const ownerName = ownerProfile
    ? `${ownerProfile.firstName} ${ownerProfile.lastName}`
    : t('common.neighbor')
  const ratingLabel = ownerProfile?.averageRating ? t('common.starCount', { rating: ownerProfile.averageRating }) : t('common.newNeighbor')
  const reviewsLabel = t('common.reviewCount', { count: ownerProfile?.reviewCount ?? 0 })

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
          <StatusBadge value={post.postType} label={formatPostType(post.postType, t)} tone={getPostTone(post.postType)} />
          <StatusBadge value={post.status} label={formatPostStatus(post.status, t)} />
        </div>
        <span className={styles.date}>{formatShortDate(post.createdAt)}</span>
      </div>

      <h3 className={styles.title}>{post.title}</h3>
      <p className={styles.description}>{post.description}</p>

      <dl className={styles.meta}>
        <div>
          <dt>{t('filters.category.label')}</dt>
          <dd>{post.category}</dd>
        </div>
        <div>
          <dt>{t('postCard.meta.location')}</dt>
          <dd>{post.addressLabel || `${post.latitude}, ${post.longitude}`}</dd>
        </div>
        {distanceKm !== null ? (
          <div>
            <dt>{t('postCard.meta.distance')}</dt>
            <dd>{t('common.distanceAway', { distance: distanceKm.toFixed(1) })}</dd>
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
              {t('postCard.ownerMeta', {
                ratingLabel,
                reviewsLabel,
              })}
            </p>
          </div>
        </div>
      ) : null}

      <div className={styles.actions}>
        <Link className={styles.primaryAction} to={`/posts/${post.id}`}>
          {t('common.actions.viewDetails')}
        </Link>
        {isEditablePost(post) ? (
          <Link className={styles.secondaryAction} to={`/posts/${post.id}/edit`}>
            {t('common.actions.edit')}
          </Link>
        ) : null}
      </div>
    </article>
  )
}

export default PostCard
