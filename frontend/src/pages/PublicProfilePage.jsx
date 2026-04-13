import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ProfileSummaryCard from '../components/profile/ProfileSummaryCard.jsx'
import ReviewList from '../components/reviews/ReviewList.jsx'
import SurfaceCard from '../components/ui/SurfaceCard.jsx'
import { clearPublicProfile, fetchProfileReviews, fetchPublicProfile } from '../features/profile/profileSlice.js'
import { useAppDispatch } from '../hooks/useAppDispatch.js'
import { useAppSelector } from '../hooks/useAppSelector.js'
import { reportReview } from '../services/api/reportApi.js'
import { readApiMessage } from '../utils/readApiMessage.js'
import styles from './PublicProfilePage.module.css'

function PublicProfilePage() {
  const dispatch = useAppDispatch()
  const { userId } = useParams()
  const { currentUser } = useAppSelector((state) => state.auth)
  const { error, publicProfile, publicStatus, reviews, reviewsStatus } = useAppSelector((state) => state.profile)
  const [activeReportId, setActiveReportId] = useState(null)
  const [reportReason, setReportReason] = useState('')
  const [reportingReviewId, setReportingReviewId] = useState(null)
  const [reportMessage, setReportMessage] = useState('')

  useEffect(() => {
    dispatch(fetchPublicProfile(userId))
    dispatch(fetchProfileReviews(userId))

    return () => {
      dispatch(clearPublicProfile())
    }
  }, [dispatch, userId])

  if (publicStatus === 'loading' && !publicProfile) {
    return (
      <SurfaceCard eyebrow="Profiles" title="Loading profile">
        <p className={styles.copy}>Fetching the public profile and its reviews...</p>
      </SurfaceCard>
    )
  }

  if (!publicProfile) {
    return (
      <SurfaceCard eyebrow="Profiles" title="Profile unavailable">
        <p className={styles.error}>{error || 'This profile could not be loaded.'}</p>
      </SurfaceCard>
    )
  }

  return (
    <div className={styles.page}>
      <ProfileSummaryCard
        actions={
          <div className={styles.actions}>
            <Link className={styles.secondaryAction} to="/map">
              Back to map
            </Link>
            {currentUser?.id === publicProfile.id ? (
              <Link className={styles.primaryAction} to="/profile">
                Open my profile
              </Link>
            ) : currentUser ? (
              <Link className={styles.primaryAction} to={`/chat?userId=${publicProfile.id}`}>
                Message neighbor
              </Link>
            ) : (
              <Link className={styles.primaryAction} to="/login">
                Sign in to message
              </Link>
            )}
          </div>
        }
        profile={publicProfile}
      />

      <SurfaceCard title="Received reviews" description="These reviews are public and come directly from completed service flows.">
        {reviewsStatus === 'loading' ? <p className={styles.copy}>Loading reviews...</p> : null}
        {reportMessage ? <p className={styles.feedback}>{reportMessage}</p> : null}

        <ReviewList
          activeReportId={activeReportId}
          currentUserId={currentUser?.id ?? null}
          onBeginReport={
            currentUser
              ? (reviewId) => {
                  setActiveReportId(reviewId)
                  setReportReason('')
                  setReportMessage('')
                }
              : null
          }
          onCancelReport={
            currentUser
              ? () => {
                  setActiveReportId(null)
                  setReportReason('')
                }
              : null
          }
          onReportReasonChange={currentUser ? setReportReason : null}
          onSubmitReport={
            currentUser
              ? async (reviewId) => {
                  setReportingReviewId(reviewId)
                  setReportMessage('')

                  try {
                    await reportReview(reviewId, { reason: reportReason.trim() })
                    setReportMessage('Review report submitted.')
                    setActiveReportId(null)
                    setReportReason('')
                  } catch (requestError) {
                    setReportMessage(readApiMessage(requestError, 'Review could not be reported'))
                  } finally {
                    setReportingReviewId(null)
                  }
                }
              : null
          }
          reportReason={reportReason}
          reportingReviewId={reportingReviewId}
          reviews={reviews}
        />
      </SurfaceCard>
    </div>
  )
}

export default PublicProfilePage
