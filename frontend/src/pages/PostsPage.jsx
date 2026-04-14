import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import PostCard from '../components/posts/PostCard.jsx'
import MetricCard from '../components/ui/MetricCard.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import SurfaceCard from '../components/ui/SurfaceCard.jsx'
import { fetchOwnPosts } from '../features/posts/postsSlice.js'
import { useAppDispatch } from '../hooks/useAppDispatch.js'
import { useAppSelector } from '../hooks/useAppSelector.js'
import { useI18n } from '../i18n/useI18n.js'
import styles from './PostsPage.module.css'

function PostsPage() {
  const dispatch = useAppDispatch()
  const { t } = useI18n()
  const { currentUser } = useAppSelector((state) => state.auth)
  const { error, ownItems, ownStatus } = useAppSelector((state) => state.posts)

  useEffect(() => {
    dispatch(fetchOwnPosts())
  }, [dispatch])

  const requestCount = ownItems.filter((post) => post.postType === 'SERVICE_REQUEST').length
  const offerCount = ownItems.filter((post) => post.postType === 'SERVICE_OFFER').length
  const activeCount = ownItems.filter((post) =>
    ['REQUESTING', 'SERVICE_ACCEPTED', 'OFFERING', 'UNAVAILABLE'].includes(post.status),
  ).length

  return (
    <div className={styles.page}>
      <SurfaceCard
        eyebrow={t('postsPage.eyebrow')}
        title={t('postsPage.title')}
        description={t('postsPage.description')}
        actions={
          <>
            <Link className={styles.primaryAction} to="/posts/new">
              {t('common.actions.createPost')}
            </Link>
            <Link className={styles.secondaryAction} to="/map">
              {t('postsPage.backToMap')}
            </Link>
          </>
        }
      >
        <div className={styles.metrics}>
          <MetricCard label={t('postsPage.metric.total')} value={ownItems.length} caption={t('postsPage.metric.totalCaption')} />
          <MetricCard label={t('posts.type.requests')} value={requestCount} caption={t('postsPage.metric.requestsCaption')} />
          <MetricCard label={t('posts.type.offers')} value={offerCount} caption={t('postsPage.metric.offersCaption')} />
          <MetricCard label={t('postsPage.metric.openWork')} value={activeCount} caption={t('postsPage.metric.openWorkCaption')} />
        </div>
      </SurfaceCard>

      <SurfaceCard title={t('postsPage.yourPosts')} description={t('postsPage.yourPostsDescription')}>
        {error ? <p className={styles.error}>{error}</p> : null}

        {ownStatus === 'loading' ? (
          <p className={styles.copy}>{t('postsPage.loading')}</p>
        ) : ownItems.length ? (
          <div className={styles.list}>
            {ownItems.map((post) => (
              <PostCard
                key={post.id}
                ownerProfile={currentUser}
                post={post}
                showOwner={false}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title={t('postsPage.emptyTitle')}
            description={t('postsPage.emptyDescription')}
            action={
              <Link className={styles.primaryAction} to="/posts/new">
                {t('common.actions.createFirstPost')}
              </Link>
            }
          />
        )}
      </SurfaceCard>
    </div>
  )
}

export default PostsPage
