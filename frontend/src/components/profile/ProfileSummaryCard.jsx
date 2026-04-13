import AvatarBadge from '../ui/AvatarBadge.jsx'
import StatusBadge from '../ui/StatusBadge.jsx'
import styles from './ProfileSummaryCard.module.css'

function ProfileSummaryCard({ profile, isOwnProfile = false, actions = null }) {
  const fullName = `${profile.firstName} ${profile.lastName}`

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <AvatarBadge src={profile.profilePicture} name={fullName} size="large" />
        <div className={styles.copy}>
          <div className={styles.titleRow}>
            <h2>{fullName}</h2>
            {isOwnProfile && profile.role ? <StatusBadge value={profile.role} label={profile.role.replace('ROLE_', '')} /> : null}
          </div>
          <p className={styles.rating}>
            {profile.averageRating ?? '0.00'} stars · {profile.reviewCount ?? 0} reviews
          </p>
          {profile.bio ? <p className={styles.bio}>{profile.bio}</p> : <p className={styles.bio}>No bio added yet.</p>}
        </div>
      </div>

      <dl className={styles.details}>
        {isOwnProfile ? (
          <>
            <div>
              <dt>Email</dt>
              <dd>{profile.email}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{profile.phoneNumber || 'Not shared'}</dd>
            </div>
          </>
        ) : null}
      </dl>

      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </article>
  )
}

export default ProfileSummaryCard

