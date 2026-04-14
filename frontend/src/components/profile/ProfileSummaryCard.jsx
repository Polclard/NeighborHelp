import AvatarBadge from '../ui/AvatarBadge.jsx'
import StatusBadge from '../ui/StatusBadge.jsx'
import { useI18n } from '../../i18n/useI18n.js'
import styles from './ProfileSummaryCard.module.css'

function ProfileSummaryCard({ profile, isOwnProfile = false, actions = null }) {
  const { t } = useI18n()
  const fullName = `${profile.firstName} ${profile.lastName}`
  const ratingLabel = t('common.starCount', { rating: profile.averageRating ?? '0.00' })
  const reviewsLabel = t('common.reviewCount', { count: profile.reviewCount ?? 0 })

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <AvatarBadge src={profile.profilePicture} name={fullName} size="large" />
        <div className={styles.copy}>
          <div className={styles.titleRow}>
            <h2>{fullName}</h2>
            {isOwnProfile && profile.role ? <StatusBadge value={profile.role} /> : null}
          </div>
          <p className={styles.rating}>
            {t('profile.summary', { ratingLabel, reviewsLabel })}
          </p>
          {profile.bio ? <p className={styles.bio}>{profile.bio}</p> : <p className={styles.bio}>{t('common.noBio')}</p>}
        </div>
      </div>

      <dl className={styles.details}>
        {isOwnProfile ? (
          <>
            <div>
              <dt>{t('profile.email')}</dt>
              <dd>{profile.email}</dd>
            </div>
            <div>
              <dt>{t('profile.phone')}</dt>
              <dd>{profile.phoneNumber || t('common.notShared')}</dd>
            </div>
          </>
        ) : null}
      </dl>

      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </article>
  )
}

export default ProfileSummaryCard
