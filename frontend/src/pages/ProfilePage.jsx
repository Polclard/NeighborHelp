import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProfileSummaryCard from '../components/profile/ProfileSummaryCard.jsx'
import ReviewList from '../components/reviews/ReviewList.jsx'
import FormField from '../components/ui/FormField.jsx'
import SurfaceCard from '../components/ui/SurfaceCard.jsx'
import { logoutUser, setAuthNotice } from '../features/auth/authSlice.js'
import {
  changePassword,
  fetchProfileReviews,
  fetchOwnProfile,
  updateOwnProfile,
  uploadAvatar,
} from '../features/profile/profileSlice.js'
import { useAppDispatch } from '../hooks/useAppDispatch.js'
import { useAppSelector } from '../hooks/useAppSelector.js'
import { useI18n } from '../i18n/useI18n.js'
import styles from './ProfilePage.module.css'

function ProfilePage() {
  const dispatch = useAppDispatch()
  const { t } = useI18n()
  const { currentUser } = useAppSelector((state) => state.auth)
  const {
    avatarStatus,
    error,
    ownProfile,
    ownStatus,
    passwordError,
    passwordStatus,
    reviews,
    reviewsStatus,
    saveStatus,
  } = useAppSelector((state) => state.profile)

  useEffect(() => {
    dispatch(fetchOwnProfile())
    if (currentUser?.id) {
      dispatch(fetchProfileReviews(currentUser.id))
    }
  }, [currentUser?.id, dispatch])

  if (ownStatus === 'loading' && !ownProfile) {
    return (
      <SurfaceCard eyebrow={t('nav.profile')} title={t('profile.loadingTitle')}>
        <p className={styles.copy}>{t('profile.loadingDescription')}</p>
      </SurfaceCard>
    )
  }

  if (!ownProfile) {
    return (
      <SurfaceCard eyebrow={t('nav.profile')} title={t('profile.unavailableTitle')}>
        <p className={styles.error}>{error || t('profile.unavailableDescription')}</p>
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
                <span>{avatarStatus === 'loading' ? t('common.loading') : t('common.actions.uploadAvatar')}</span>
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
                {t('profile.manageMyPosts')}
              </Link>
              {ownProfile.role === 'ROLE_ADMIN' ? (
                <Link className={styles.secondaryAction} to="/admin">
                  {t('profile.openAdminPanel')}
                </Link>
              ) : null}
            </div>
          }
          profile={ownProfile}
        />

        <SurfaceCard eyebrow={t('nav.profile')} title={t('profile.editTitle')} description={t('profile.editDescription')}>
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
        eyebrow={t('nav.profile')}
        title={t('profile.password.title')}
        description={t('profile.password.description')}
      >
        {passwordError ? <p className={styles.error}>{passwordError}</p> : null}

        <ChangePasswordForm dispatch={dispatch} passwordStatus={passwordStatus} />
      </SurfaceCard>

      <SurfaceCard
        title={t('profile.reviewsTitle')}
        description={t('profile.reviewsDescription')}
      >
        {reviewsStatus === 'loading' ? <p className={styles.copy}>{t('profile.loadingReviews')}</p> : <ReviewList reviews={reviews} />}
      </SurfaceCard>
    </div>
  )
}

function ProfileForm({ dispatch, profile, saveStatus }) {
  const { t } = useI18n()
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
        <FormField label={t('auth.firstName')} error={validationErrors.firstName}>
          <input
            type="text"
            value={formValues.firstName}
            onChange={(event) => setFormValues((current) => ({ ...current, firstName: event.target.value }))}
          />
        </FormField>

        <FormField label={t('auth.lastName')} error={validationErrors.lastName}>
          <input
            type="text"
            value={formValues.lastName}
            onChange={(event) => setFormValues((current) => ({ ...current, lastName: event.target.value }))}
          />
        </FormField>
      </div>

      <FormField label={t('auth.phoneNumber')} error={validationErrors.phoneNumber}>
        <input
          type="text"
          value={formValues.phoneNumber}
          placeholder="+38970123456"
          onChange={(event) => setFormValues((current) => ({ ...current, phoneNumber: event.target.value }))}
        />
      </FormField>

      <FormField label={t('profile.bio')} error={validationErrors.bio}>
        <textarea
          value={formValues.bio}
          placeholder={t('profile.bioPlaceholder')}
          onChange={(event) => setFormValues((current) => ({ ...current, bio: event.target.value }))}
        />
      </FormField>

      <button className={styles.primaryAction} type="submit" disabled={saveStatus === 'loading'}>
        {saveStatus === 'loading' ? t('profile.saving') : t('common.actions.saveProfile')}
      </button>
    </form>
  )
}

function ChangePasswordForm({ dispatch, passwordStatus }) {
  const { t } = useI18n()
  const [formValues, setFormValues] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [validationErrors, setValidationErrors] = useState({})

  return (
    <form
      className={styles.form}
      onSubmit={async (event) => {
        event.preventDefault()
        setValidationErrors({})

        if (formValues.newPassword !== formValues.confirmPassword) {
          setValidationErrors({ confirmPassword: t('auth.validation.passwordsMismatch') })
          return
        }

        try {
          await dispatch(changePassword(formValues)).unwrap()
        } catch (requestError) {
          setValidationErrors(requestError?.validationErrors ?? {})
          return
        }

        // Changing the password revokes every session, so the user signs in again with the new one.
        dispatch(setAuthNotice(t('profile.password.signedOutNotice')))
        dispatch(logoutUser())
      }}
    >
      <FormField label={t('profile.password.current')} error={validationErrors.currentPassword}>
        <input
          type="password"
          autoComplete="current-password"
          value={formValues.currentPassword}
          onChange={(event) => setFormValues((current) => ({ ...current, currentPassword: event.target.value }))}
        />
      </FormField>

      <div className={styles.row}>
        <FormField label={t('profile.password.new')} error={validationErrors.newPassword}>
          <input
            type="password"
            autoComplete="new-password"
            value={formValues.newPassword}
            onChange={(event) => setFormValues((current) => ({ ...current, newPassword: event.target.value }))}
          />
        </FormField>

        <FormField label={t('profile.password.confirm')} error={validationErrors.confirmPassword}>
          <input
            type="password"
            autoComplete="new-password"
            value={formValues.confirmPassword}
            onChange={(event) => setFormValues((current) => ({ ...current, confirmPassword: event.target.value }))}
          />
        </FormField>
      </div>

      <button className={styles.primaryAction} type="submit" disabled={passwordStatus === 'loading'}>
        {passwordStatus === 'loading' ? t('profile.password.saving') : t('profile.password.submit')}
      </button>
    </form>
  )
}

function normalizeNullable(value) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export default ProfilePage
