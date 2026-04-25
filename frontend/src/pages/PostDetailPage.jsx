import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PostMap from '../components/posts/PostMap.jsx'
import PostPhotoGallery from '../components/posts/PostPhotoGallery.jsx'
import ProfileSummaryCard from '../components/profile/ProfileSummaryCard.jsx'
import ReviewList from '../components/reviews/ReviewList.jsx'
import SurfaceCard from '../components/ui/SurfaceCard.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import { formatPostStatus, formatPostType, getAvailableStatusTransitions, isEditablePost } from '../constants/posts.js'
import {
  acceptPostRequest,
  changePostStatus,
  clearActivePost,
  clearPostsError,
  deletePost,
  deletePostPhoto,
  fetchPostDetail,
  uploadPostPhoto,
} from '../features/posts/postsSlice.js'
import { useBrowserLocation } from '../hooks/useBrowserLocation.js'
import { useAppDispatch } from '../hooks/useAppDispatch.js'
import { useAppSelector } from '../hooks/useAppSelector.js'
import { fetchPublicProfile as fetchPublicProfileRequest, fetchUserReviews as fetchUserReviewsRequest } from '../services/api/profileApi.js'
import { reportPost } from '../services/api/reportApi.js'
import { createReview } from '../services/api/reviewApi.js'
import { useI18n } from '../i18n/useI18n.js'
import { formatDateTime } from '../utils/formatDateTime.js'
import { fetchDirectionsRoute } from '../utils/fetchDirectionsRoute.js'
import { readApiMessage } from '../utils/readApiMessage.js'
import styles from './PostDetailPage.module.css'

const createIdleDirectionsState = () => ({
  coordinates: [],
  error: null,
  postId: null,
  status: 'idle',
  summary: null,
})

function PostDetailPage() {
  const dispatch = useAppDispatch()
  const { t } = useI18n()
  const navigate = useNavigate()
  const { postId } = useParams()
  const { currentUser } = useAppSelector((state) => state.auth)
  const { actionStatus, activePost, detailStatus, error, photoStatus } = useAppSelector((state) => state.posts)
  const [authorProfile, setAuthorProfile] = useState(null)
  const [helperProfile, setHelperProfile] = useState(null)
  const [helperReviews, setHelperReviews] = useState([])
  const [reportReason, setReportReason] = useState('')
  const [reportStatus, setReportStatus] = useState('idle')
  const [reportMessage, setReportMessage] = useState('')
  const [reviewComment, setReviewComment] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewStatus, setReviewStatus] = useState('idle')
  const [mapMode, setMapMode] = useState('2d')
  const [directionsState, setDirectionsState] = useState(createIdleDirectionsState)
  const { position, requestLocation, status: locationStatus } = useBrowserLocation(true)

  useEffect(() => {
    dispatch(clearPostsError())
    dispatch(fetchPostDetail(postId))

    return () => {
      dispatch(clearActivePost())
    }
  }, [dispatch, postId])

  useEffect(() => {
    if (!activePost) {
      return
    }

    let active = true

    Promise.all([
      fetchPublicProfileRequest(activePost.userId),
      activePost.acceptedUserId ? fetchPublicProfileRequest(activePost.acceptedUserId) : Promise.resolve(null),
      activePost.acceptedUserId ? fetchUserReviewsRequest(activePost.acceptedUserId) : Promise.resolve([]),
    ])
      .then(([owner, helper, reviews]) => {
        if (!active) {
          return
        }

        setAuthorProfile(owner)
        setHelperProfile(helper)
        setHelperReviews(reviews)
      })
      .catch(() => {
        if (!active) {
          return
        }

        setAuthorProfile(null)
        setHelperProfile(null)
        setHelperReviews([])
      })

    return () => {
      active = false
    }
  }, [activePost])

  if (detailStatus === 'loading' && !activePost) {
    return (
      <SurfaceCard eyebrow={t('postsPage.eyebrow')} title={t('postDetail.loadingTitle')}>
        <p className={styles.copy}>{t('postDetail.loadingDescription')}</p>
      </SurfaceCard>
    )
  }

  if (!activePost) {
    return (
      <SurfaceCard eyebrow={t('postsPage.eyebrow')} title={t('postDetail.unavailableTitle')}>
        <p className={styles.error}>{error || t('postDetail.unavailableDescription')}</p>
      </SurfaceCard>
    )
  }

  const isOwner = currentUser?.id === activePost.userId
  const canAccept =
    currentUser &&
    currentUser.id !== activePost.userId &&
    activePost.postType === 'SERVICE_REQUEST' &&
    activePost.status === 'REQUESTING'
  const canReview =
    currentUser &&
    currentUser.id === activePost.userId &&
    activePost.postType === 'SERVICE_REQUEST' &&
    activePost.status === 'SERVICE_DONE' &&
    activePost.acceptedUserId &&
    !helperReviews.some((review) => review.postId === activePost.id)
  const canReport = currentUser && currentUser.id !== activePost.userId
  const canMessageAuthor = currentUser && currentUser.id !== activePost.userId
  const transitions = isOwner ? getAvailableStatusTransitions(activePost, t) : []
  const postReview = helperReviews.filter((review) => review.postId === activePost.id)
  const directionsStatus = directionsState.postId === postId ? directionsState.status : 'idle'
  const directionsCoordinates = directionsState.postId === postId ? directionsState.coordinates : []
  const directionsError = directionsState.postId === postId ? directionsState.error : null
  const directionsSummary = directionsState.postId === postId ? directionsState.summary : null

  const handleRefreshHelperReviews = async () => {
    if (!activePost.acceptedUserId) {
      return
    }

    const [helper, reviews] = await Promise.all([
      fetchPublicProfileRequest(activePost.acceptedUserId),
      fetchUserReviewsRequest(activePost.acceptedUserId),
    ])

    setHelperProfile(helper)
    setHelperReviews(reviews)
  }

  const handleToggleDirections = async () => {
    if (directionsStatus === 'loading') {
      return
    }

    if (directionsStatus === 'ready') {
      setDirectionsState(createIdleDirectionsState())
      return
    }

    const origin = locationStatus === 'ready' ? position : await requestLocation()

    if (!origin) {
      setDirectionsState({
        coordinates: [],
        error: t('postDetail.routeLocationRequired'),
        postId,
        status: 'error',
        summary: null,
      })
      return
    }

    setDirectionsState({
      coordinates: [],
      error: null,
      postId,
      status: 'loading',
      summary: null,
    })

    try {
      const nextRoute = await fetchDirectionsRoute(origin, {
        latitude: Number(activePost.latitude),
        longitude: Number(activePost.longitude),
      })

      setDirectionsState({
        coordinates: nextRoute.coordinates,
        error: null,
        postId,
        status: 'ready',
        summary: {
          distanceKm: nextRoute.distanceKm,
          durationMinutes: nextRoute.durationMinutes,
        },
      })
    } catch {
      setDirectionsState({
        coordinates: [],
        error: t('map.route.error'),
        postId,
        status: 'error',
        summary: null,
      })
    }
  }

  return (
    <div className={styles.page}>
      <SurfaceCard
        eyebrow={t('postDetail.eyebrow')}
        title={activePost.title}
        description={activePost.description}
        actions={
          <div className={styles.topActions}>
            <Link className={styles.secondaryAction} to="/map">
              {t('postsPage.backToMap')}
            </Link>
            {isOwner && isEditablePost(activePost) ? (
              <Link className={styles.secondaryAction} to={`/posts/${activePost.id}/edit`}>
                {t('common.actions.editPost')}
              </Link>
            ) : null}
            {canMessageAuthor ? (
              <Link className={styles.primaryAction} to={`/chat?userId=${activePost.userId}&postId=${activePost.id}`}>
                {t('common.actions.messageAuthor')}
              </Link>
            ) : null}
          </div>
        }
      >
        <div className={styles.badges}>
          <StatusBadge value={activePost.postType} label={formatPostType(activePost.postType, t)} />
          <StatusBadge value={activePost.status} label={formatPostStatus(activePost.status, t)} />
        </div>

        <div className={styles.layout}>
          <div className={styles.mainColumn}>
            <SurfaceCard title={t('postDetail.locationTitle')} description={activePost.addressLabel || t('postDetail.locationDescription')}>
              <PostMap
                markers={[
                  {
                    id: activePost.id,
                    title: activePost.title,
                    postType: activePost.postType,
                    status: activePost.status,
                    category: activePost.category,
                    latitude: activePost.latitude,
                    longitude: activePost.longitude,
                  },
                ]}
                center={[Number(activePost.latitude), Number(activePost.longitude)]}
                mapMode={mapMode}
                routeCoordinates={directionsCoordinates}
                routeError={directionsError}
                routeStatus={directionsStatus}
                routeSummary={directionsSummary}
                viewerPosition={locationStatus === 'ready' ? position : null}
                zoom={15}
              />
              <div className={styles.locationActions}>
                <div className={styles.modeToggle} role="group" aria-label={t('map.viewMode')}>
                  <button
                    type="button"
                    className={mapMode === '2d' ? `${styles.modeButton} ${styles.modeButtonActive}` : styles.modeButton}
                    onClick={() => setMapMode('2d')}
                  >
                    {t('map.view2d')}
                  </button>
                  <button
                    type="button"
                    className={mapMode === '3d' ? `${styles.modeButton} ${styles.modeButtonActive}` : styles.modeButton}
                    onClick={() => setMapMode('3d')}
                  >
                    {t('map.view3d')}
                  </button>
                </div>
                <button
                  className={styles.primaryAction}
                  type="button"
                  disabled={directionsStatus === 'loading'}
                  onClick={handleToggleDirections}
                >
                  {directionsStatus === 'loading'
                    ? t('common.loading')
                    : directionsStatus === 'ready'
                      ? t('common.actions.hideDirections')
                      : t('common.actions.getDirections')}
                </button>
              </div>
            </SurfaceCard>

            <SurfaceCard title={t('postDetail.photoGalleryTitle')} description={t('postDetail.photoGalleryDescription')}>
              <PostPhotoGallery
                editable={isOwner && isEditablePost(activePost)}
                onRemove={async (photoId) => {
                  try {
                    await dispatch(deletePostPhoto({ postId: activePost.id, photoId })).unwrap()
                  } catch {
                    // The slice already stores the API error for the page.
                  }
                }}
                photos={activePost.photos}
              />

              {isOwner && isEditablePost(activePost) ? (
                <label className={styles.uploadField}>
                  <span>{t('common.actions.addMorePhotos')}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    disabled={photoStatus === 'loading'}
                    onChange={async (event) => {
                      const files = Array.from(event.target.files ?? []).slice(0, 5)

                      try {
                        for (const file of files) {
                          await dispatch(uploadPostPhoto({ postId: activePost.id, file })).unwrap()
                        }
                      } catch {
                        // The slice already stores the API error for the page.
                      }
                    }}
                  />
                </label>
              ) : null}
            </SurfaceCard>

            {helperProfile ? (
              <SurfaceCard
                title={t('postDetail.serviceCompletionTitle')}
                description={t('postDetail.serviceCompletionDescription')}
              >
                <ReviewList reviews={postReview} />

                {canReview ? (
                  <form
                    className={styles.reviewForm}
                    onSubmit={async (event) => {
                      event.preventDefault()
                      setReviewStatus('loading')

                      try {
                        await createReview(activePost.id, {
                          rating: Number(reviewRating),
                          comment: reviewComment.trim() || null,
                        })
                        setReviewComment('')
                        setReviewRating(5)
                        setReviewStatus('ready')
                        await handleRefreshHelperReviews()
                      } catch (requestError) {
                        setReviewStatus(readApiMessage(requestError, t('postDetail.reviewFailed')))
                      }
                    }}
                  >
                    <h3>{t('postDetail.leaveReviewTitle')}</h3>
                    <label className={styles.inlineField}>
                      <span>{t('postDetail.rating')}</span>
                      <select value={reviewRating} onChange={(event) => setReviewRating(event.target.value)}>
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <option key={rating} value={rating}>
                            {t(rating > 1 ? 'postDetail.star.other' : 'postDetail.star.one', { count: rating })}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={styles.inlineField}>
                      <span>{t('postDetail.comment')}</span>
                      <textarea
                        value={reviewComment}
                        placeholder={t('postDetail.reviewPlaceholder')}
                        onChange={(event) => setReviewComment(event.target.value)}
                      />
                    </label>
                    <button className={styles.primaryAction} type="submit" disabled={reviewStatus === 'loading'}>
                      {reviewStatus === 'loading' ? t('postDetail.submittingReview') : t('common.actions.submitReview')}
                    </button>
                    {typeof reviewStatus === 'string' && reviewStatus !== 'idle' && reviewStatus !== 'loading' ? (
                      <p className={styles.feedback}>
                        {reviewStatus === 'ready' ? t('postDetail.reviewSubmitted') : reviewStatus}
                      </p>
                    ) : null}
                  </form>
                ) : null}
              </SurfaceCard>
            ) : null}
          </div>

          <aside className={styles.sideColumn}>
            {authorProfile ? (
              <ProfileSummaryCard
                actions={
                  <div className={styles.sideActions}>
                    <Link className={styles.secondaryAction} to={`/profiles/${authorProfile.id}`}>
                      {t('postDetail.openPublicProfile')}
                    </Link>
                  </div>
                }
                profile={authorProfile}
              />
            ) : null}

            {helperProfile ? (
              <ProfileSummaryCard
                actions={
                  <div className={styles.sideActions}>
                    <Link className={styles.secondaryAction} to={`/profiles/${helperProfile.id}`}>
                      {t('postDetail.acceptedHelperProfile')}
                    </Link>
                  </div>
                }
                profile={helperProfile}
              />
            ) : null}

            <SurfaceCard title={t('postDetail.metadataTitle')}>
              <dl className={styles.metadata}>
                <div>
                  <dt>{t('postDetail.metadata.category')}</dt>
                  <dd>{activePost.category}</dd>
                </div>
                <div>
                  <dt>{t('postDetail.metadata.created')}</dt>
                  <dd>{formatDateTime(activePost.createdAt)}</dd>
                </div>
                <div>
                  <dt>{t('postDetail.metadata.updated')}</dt>
                  <dd>{formatDateTime(activePost.updatedAt)}</dd>
                </div>
                <div>
                  <dt>{t('postDetail.metadata.contactPhone')}</dt>
                  <dd>{activePost.contactPhone || t('common.notShared')}</dd>
                </div>
                <div>
                  <dt>{t('postDetail.metadata.contactEmail')}</dt>
                  <dd>{activePost.contactEmail || t('common.notShared')}</dd>
                </div>
              </dl>
            </SurfaceCard>

            {canAccept || transitions.length || isOwner || canReport ? (
              <SurfaceCard title={t('postDetail.actionsTitle')} description={t('postDetail.actionsDescription')}>
                <div className={styles.sideActions}>
                  {canAccept ? (
                    <button
                      className={styles.primaryAction}
                      type="button"
                      disabled={actionStatus === 'loading'}
                      onClick={async () => {
                        try {
                          await dispatch(acceptPostRequest(activePost.id)).unwrap()
                        } catch {
                          // The slice already stores the API error for the page.
                        }
                      }}
                    >
                      {t('common.actions.acceptRequest')}
                    </button>
                  ) : null}

                  {transitions.map((transition) => (
                    <button
                      key={transition.value}
                      className={styles.secondaryAction}
                      type="button"
                      disabled={actionStatus === 'loading'}
                      onClick={async () => {
                        try {
                          await dispatch(
                            changePostStatus({ postId: activePost.id, status: transition.value }),
                          ).unwrap()
                        } catch {
                          // The slice already stores the API error for the page.
                        }
                      }}
                    >
                      {transition.label}
                    </button>
                  ))}

                  {isOwner ? (
                    <button
                      className={styles.dangerAction}
                      type="button"
                      disabled={actionStatus === 'loading'}
                      onClick={async () => {
                        try {
                          await dispatch(deletePost(activePost.id)).unwrap()
                          navigate('/posts', { replace: true })
                        } catch {
                          // The slice already stores the API error for the page.
                        }
                      }}
                    >
                      {t('common.actions.deletePost')}
                    </button>
                  ) : null}
                </div>

                {canReport ? (
                  <form
                    className={styles.reportForm}
                    onSubmit={async (event) => {
                      event.preventDefault()
                      setReportStatus('loading')
                      setReportMessage('')

                      try {
                        await reportPost(activePost.id, { reason: reportReason.trim() })
                        setReportReason('')
                        setReportStatus('ready')
                        setReportMessage(t('postDetail.reportSubmitted'))
                      } catch (requestError) {
                        setReportStatus('error')
                        setReportMessage(readApiMessage(requestError, t('postDetail.reportFailed')))
                      }
                    }}
                  >
                    <label className={styles.inlineField}>
                      <span>{t('common.actions.reportPost')}</span>
                      <textarea
                        value={reportReason}
                        placeholder={t('postDetail.reportPlaceholder')}
                        onChange={(event) => setReportReason(event.target.value)}
                      />
                    </label>
                    <button className={styles.secondaryAction} type="submit" disabled={reportStatus === 'loading'}>
                      {reportStatus === 'loading' ? t('postDetail.submittingReport') : t('common.actions.submitReport')}
                    </button>
                    {reportMessage ? <p className={styles.feedback}>{reportMessage}</p> : null}
                  </form>
                ) : null}
              </SurfaceCard>
            ) : null}
          </aside>
        </div>
      </SurfaceCard>

      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  )
}

export default PostDetailPage
