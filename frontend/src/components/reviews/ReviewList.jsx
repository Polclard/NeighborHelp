import { formatDateTime } from '../../utils/formatDateTime.js'
import { useI18n } from '../../i18n/useI18n.js'
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
  const { t } = useI18n()

  if (!reviews.length) {
    return (
      <EmptyState
        title={t('reviews.emptyTitle')}
        description={t('reviews.emptyDescription')}
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

            <p className={styles.comment}>{review.comment || t('reviews.noComment')}</p>

            {canReport ? (
              <div className={styles.reportBlock}>
                <button className={styles.reportButton} type="button" onClick={() => onBeginReport(review.id)}>
                  {t('common.actions.reportReview')}
                </button>

                {activeReportId === review.id ? (
                  <div className={styles.reportForm}>
                    <textarea
                      value={reportReason}
                      placeholder={t('reviews.reportPlaceholder')}
                      onChange={(event) => onReportReasonChange(event.target.value)}
                    />
                    <div className={styles.reportActions}>
                      <button
                        className={styles.submit}
                        type="button"
                        disabled={reportingReviewId === review.id}
                        onClick={() => onSubmitReport(review.id)}
                      >
                        {reportingReviewId === review.id ? t('reviews.submitting') : t('common.actions.submitReport')}
                      </button>
                      <button className={styles.cancel} type="button" onClick={onCancelReport}>
                        {t('common.actions.cancel')}
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
