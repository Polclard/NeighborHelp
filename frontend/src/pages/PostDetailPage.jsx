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
import { formatDateTime } from '../utils/formatDateTime.js'
import { openDirections } from '../utils/openDirections.js'
import { readApiMessage } from '../utils/readApiMessage.js'
import styles from './PostDetailPage.module.css'

function PostDetailPage() {
  const dispatch = useAppDispatch()
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
  const { position, status: locationStatus } = useBrowserLocation(true)

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
      <SurfaceCard eyebrow="Posts" title="Loading post details">
        <p className={styles.copy}>Fetching the latest post data...</p>
      </SurfaceCard>
    )
  }

  if (!activePost) {
    return (
      <SurfaceCard eyebrow="Posts" title="Post not available">
        <p className={styles.error}>{error || 'This post could not be loaded.'}</p>
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
  const transitions = isOwner ? getAvailableStatusTransitions(activePost) : []
  const postReview = helperReviews.filter((review) => review.postId === activePost.id)

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

  return (
    <div className={styles.page}>
      <SurfaceCard
        eyebrow="Post detail"
        title={activePost.title}
        description={activePost.description}
        actions={
          <div className={styles.topActions}>
            <Link className={styles.secondaryAction} to="/map">
              Back to map
            </Link>
            {isOwner && isEditablePost(activePost) ? (
              <Link className={styles.secondaryAction} to={`/posts/${activePost.id}/edit`}>
                Edit post
              </Link>
            ) : null}
            {canMessageAuthor ? (
              <Link className={styles.primaryAction} to={`/chat?userId=${activePost.userId}&postId=${activePost.id}`}>
                Message author
              </Link>
            ) : null}
          </div>
        }
      >
        <div className={styles.badges}>
          <StatusBadge value={activePost.postType} label={formatPostType(activePost.postType)} />
          <StatusBadge value={activePost.status} label={formatPostStatus(activePost.status)} />
        </div>

        <div className={styles.layout}>
          <div className={styles.mainColumn}>
            <SurfaceCard title="Location" description={activePost.addressLabel || 'Pinned service location'}>
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
                viewerPosition={locationStatus === 'ready' ? position : null}
                zoom={15}
              />
              <div className={styles.locationActions}>
                <button
                  className={styles.primaryAction}
                  type="button"
                  onClick={() =>
                    openDirections(
                      {
                        latitude: Number(activePost.latitude),
                        longitude: Number(activePost.longitude),
                      },
                      locationStatus === 'ready' ? position : null,
                    )
                  }
                >
                  Get directions
                </button>
              </div>
            </SurfaceCard>

            <SurfaceCard title="Photo gallery" description="Photos can be added or removed while the post is still editable.">
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
                  <span>Add more photos</span>
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
                title="Service completion and reviews"
                description="Completed request flows can now collect the public trust signal that powers profiles."
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
                        setReviewStatus(readApiMessage(requestError, 'Review could not be submitted'))
                      }
                    }}
                  >
                    <h3>Leave a review for the accepted helper</h3>
                    <label className={styles.inlineField}>
                      <span>Rating</span>
                      <select value={reviewRating} onChange={(event) => setReviewRating(event.target.value)}>
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <option key={rating} value={rating}>
                            {rating} star{rating > 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={styles.inlineField}>
                      <span>Comment</span>
                      <textarea
                        value={reviewComment}
                        placeholder="Share how the service went."
                        onChange={(event) => setReviewComment(event.target.value)}
                      />
                    </label>
                    <button className={styles.primaryAction} type="submit" disabled={reviewStatus === 'loading'}>
                      {reviewStatus === 'loading' ? 'Submitting review...' : 'Submit review'}
                    </button>
                    {typeof reviewStatus === 'string' && reviewStatus !== 'idle' && reviewStatus !== 'loading' ? (
                      <p className={styles.feedback}>
                        {reviewStatus === 'ready' ? 'Review submitted successfully.' : reviewStatus}
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
                      Open public profile
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
                      Accepted helper profile
                    </Link>
                  </div>
                }
                profile={helperProfile}
              />
            ) : null}

            <SurfaceCard title="Post metadata">
              <dl className={styles.metadata}>
                <div>
                  <dt>Category</dt>
                  <dd>{activePost.category}</dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{formatDateTime(activePost.createdAt)}</dd>
                </div>
                <div>
                  <dt>Updated</dt>
                  <dd>{formatDateTime(activePost.updatedAt)}</dd>
                </div>
                <div>
                  <dt>Contact phone</dt>
                  <dd>{activePost.contactPhone || 'Not shared'}</dd>
                </div>
                <div>
                  <dt>Contact email</dt>
                  <dd>{activePost.contactEmail || 'Not shared'}</dd>
                </div>
              </dl>
            </SurfaceCard>

            {canAccept || transitions.length || isOwner || canReport ? (
              <SurfaceCard title="Available actions" description="Lifecycle and moderation controls are shown only when the backend would allow them.">
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
                      Accept request
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
                      Delete post
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
                        setReportMessage('Post report submitted.')
                      } catch (requestError) {
                        setReportStatus('error')
                        setReportMessage(readApiMessage(requestError, 'Post could not be reported'))
                      }
                    }}
                  >
                    <label className={styles.inlineField}>
                      <span>Report this post</span>
                      <textarea
                        value={reportReason}
                        placeholder="Explain what needs moderation attention."
                        onChange={(event) => setReportReason(event.target.value)}
                      />
                    </label>
                    <button className={styles.secondaryAction} type="submit" disabled={reportStatus === 'loading'}>
                      {reportStatus === 'loading' ? 'Submitting report...' : 'Submit report'}
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
