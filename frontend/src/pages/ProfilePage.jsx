import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProfileSummaryCard from '../components/profile/ProfileSummaryCard.jsx'
import ReviewList from '../components/reviews/ReviewList.jsx'
import FormField from '../components/ui/FormField.jsx'
import SurfaceCard from '../components/ui/SurfaceCard.jsx'
import { fetchProfileReviews, fetchOwnProfile, updateOwnProfile, uploadAvatar } from '../features/profile/profileSlice.js'
import { useAppDispatch } from '../hooks/useAppDispatch.js'
import { useAppSelector } from '../hooks/useAppSelector.js'
import styles from './ProfilePage.module.css'

function ProfilePage() {
  const dispatch = useAppDispatch()
  const { currentUser } = useAppSelector((state) => state.auth)
  const { avatarStatus, error, ownProfile, ownStatus, reviews, reviewsStatus, saveStatus } = useAppSelector(
    (state) => state.profile,
  )

  useEffect(() => {
    dispatch(fetchOwnProfile())
    if (currentUser?.id) {
      dispatch(fetchProfileReviews(currentUser.id))
    }
  }, [currentUser?.id, dispatch])

  if (ownStatus === 'loading' && !ownProfile) {
    return (
      <SurfaceCard eyebrow="Profile" title="Loading your workspace">
        <p className={styles.copy}>Fetching your profile data...</p>
      </SurfaceCard>
    )
  }

  if (!ownProfile) {
    return (
      <SurfaceCard eyebrow="Profile" title="Profile unavailable">
        <p className={styles.error}>{error || 'Your profile could not be loaded.'}</p>
      </SurfaceCard>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <ProfileSummaryCard
          isOwnProfile
          actions={
            <div className={styles.actions}>
              <label className={styles.uploadButton}>
                <span>{avatarStatus === 'loading' ? 'Uploading avatar...' : 'Upload avatar'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={async (event) => {
                    const file = event.target.files?.[0]
                    if (!file) {
                      return
                    }

                    try {
                      await dispatch(uploadAvatar(file)).unwrap()
                    } catch {
                      // The slice already stores the API error for the page.
                    }
                  }}
                />
              </label>
              <Link className={styles.secondaryAction} to="/posts">
                Manage my posts
              </Link>
              {ownProfile.role === 'ROLE_ADMIN' ? (
                <Link className={styles.secondaryAction} to="/admin">
                  Open admin panel
                </Link>
              ) : null}
            </div>
          }
          profile={ownProfile}
        />

        <SurfaceCard eyebrow="Profile" title="Edit your details" description="These values are reused as the default contact information for new posts.">
          {error ? <p className={styles.error}>{error}</p> : null}

          <ProfileForm
            key={`${ownProfile.id}-${ownProfile.firstName}-${ownProfile.lastName}-${ownProfile.phoneNumber ?? ''}-${ownProfile.bio ?? ''}`}
            dispatch={dispatch}
            profile={ownProfile}
            saveStatus={saveStatus}
          />
        </SurfaceCard>
      </div>

      <SurfaceCard
        title="Reviews you have received"
        description="Public reviews shape the trust signal that appears on your profile and on your posts."
      >
        {reviewsStatus === 'loading' ? <p className={styles.copy}>Loading reviews...</p> : <ReviewList reviews={reviews} />}
      </SurfaceCard>
    </div>
  )
}

function ProfileForm({ dispatch, profile, saveStatus }) {
  const [formValues, setFormValues] = useState({
    firstName: profile.firstName ?? '',
    lastName: profile.lastName ?? '',
    phoneNumber: profile.phoneNumber ?? '',
    bio: profile.bio ?? '',
  })
  const [validationErrors, setValidationErrors] = useState({})

  return (
    <form
      className={styles.form}
      onSubmit={async (event) => {
        event.preventDefault()
        setValidationErrors({})

        try {
          await dispatch(
            updateOwnProfile({
              firstName: formValues.firstName.trim(),
              lastName: formValues.lastName.trim(),
              phoneNumber: normalizeNullable(formValues.phoneNumber),
              bio: normalizeNullable(formValues.bio),
            }),
          ).unwrap()
        } catch (requestError) {
          setValidationErrors(requestError?.validationErrors ?? {})
        }
      }}
    >
      <div className={styles.row}>
        <FormField label="First name" error={validationErrors.firstName}>
          <input
            type="text"
            value={formValues.firstName}
            onChange={(event) => setFormValues((current) => ({ ...current, firstName: event.target.value }))}
          />
        </FormField>

        <FormField label="Last name" error={validationErrors.lastName}>
          <input
            type="text"
            value={formValues.lastName}
            onChange={(event) => setFormValues((current) => ({ ...current, lastName: event.target.value }))}
          />
        </FormField>
      </div>

      <FormField label="Phone number" error={validationErrors.phoneNumber}>
        <input
          type="text"
          value={formValues.phoneNumber}
          placeholder="+38970123456"
          onChange={(event) => setFormValues((current) => ({ ...current, phoneNumber: event.target.value }))}
        />
      </FormField>

      <FormField label="Bio" error={validationErrors.bio}>
        <textarea
          value={formValues.bio}
          placeholder="What kinds of things do neighbors usually ask you for help with?"
          onChange={(event) => setFormValues((current) => ({ ...current, bio: event.target.value }))}
        />
      </FormField>

      <button className={styles.primaryAction} type="submit" disabled={saveStatus === 'loading'}>
        {saveStatus === 'loading' ? 'Saving profile...' : 'Save profile'}
      </button>
    </form>
  )
}

function normalizeNullable(value) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export default ProfilePage
