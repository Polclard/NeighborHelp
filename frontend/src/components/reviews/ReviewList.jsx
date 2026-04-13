import { formatDateTime } from '../../utils/formatDateTime.js'
import EmptyState from '../ui/EmptyState.jsx'
import styles from './ReviewList.module.css'

function ReviewList({
  reviews,
  currentUserId = null,
  activeReportId = null,
  reportReason = '',
  reportingReviewId = null,
  onBeginReport = null,
  onCancelReport = null,
  onReportReasonChange = null,
  onSubmitReport = null,
}) {
  if (!reviews.length) {
    return (
      <EmptyState
        title="No reviews yet"
        description="Completed services will start building trust here once neighbors leave ratings."
      />
    )
  }

  return (
    <div className={styles.list}>
      {reviews.map((review) => {
        const canReport = Boolean(onBeginReport) && review.reviewerId !== currentUserId
        const stars = `${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}`

        return (
          <article key={review.id} className={styles.card}>
            <div className={styles.header}>
              <div>
                <h3>
                  {review.reviewerFirstName} {review.reviewerLastName}
                </h3>
                <p className={styles.subtle}>{formatDateTime(review.createdAt)}</p>
              </div>
              <strong className={styles.rating}>{stars}</strong>
            </div>

            <p className={styles.comment}>{review.comment || 'No written comment left.'}</p>

            {canReport ? (
              <div className={styles.reportBlock}>
                <button className={styles.reportButton} type="button" onClick={() => onBeginReport(review.id)}>
                  Report review
                </button>

                {activeReportId === review.id ? (
                  <div className={styles.reportForm}>
                    <textarea
                      value={reportReason}
                      placeholder="Explain why this review should be reviewed by admins."
                      onChange={(event) => onReportReasonChange(event.target.value)}
                    />
                    <div className={styles.reportActions}>
                      <button
                        className={styles.submit}
                        type="button"
                        disabled={reportingReviewId === review.id}
                        onClick={() => onSubmitReport(review.id)}
                      >
                        {reportingReviewId === review.id ? 'Submitting...' : 'Submit report'}
                      </button>
                      <button className={styles.cancel} type="button" onClick={onCancelReport}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}

export default ReviewList

