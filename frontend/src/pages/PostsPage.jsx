import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import PostCard from '../components/posts/PostCard.jsx'
import MetricCard from '../components/ui/MetricCard.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import SurfaceCard from '../components/ui/SurfaceCard.jsx'
import { fetchOwnPosts } from '../features/posts/postsSlice.js'
import { useAppDispatch } from '../hooks/useAppDispatch.js'
import { useAppSelector } from '../hooks/useAppSelector.js'
import styles from './PostsPage.module.css'

function PostsPage() {
  const dispatch = useAppDispatch()
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
        eyebrow="Posts"
        title="Manage your service board"
        description="This page is focused on your own requests and offers, while the public map remains optimized for discovery."
        actions={
          <>
            <Link className={styles.primaryAction} to="/posts/new">
              Create new post
            </Link>
            <Link className={styles.secondaryAction} to="/map">
              Back to map
            </Link>
          </>
        }
      >
        <div className={styles.metrics}>
          <MetricCard label="Total posts" value={ownItems.length} caption="Everything you have published so far." />
          <MetricCard label="Requests" value={requestCount} caption="Jobs where you asked the community for help." />
          <MetricCard label="Offers" value={offerCount} caption="Services you are actively offering to neighbors." />
          <MetricCard label="Open work" value={activeCount} caption="Items that are still available or in progress." />
        </div>
      </SurfaceCard>

      <SurfaceCard title="Your posts" description="Open a post to manage its photos, lifecycle state, and contact actions.">
        {error ? <p className={styles.error}>{error}</p> : null}

        {ownStatus === 'loading' ? (
          <p className={styles.copy}>Loading your posts...</p>
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
            title="You have not posted anything yet"
            description="Create your first request or offer so it appears on the public map and in your management board."
            action={
              <Link className={styles.primaryAction} to="/posts/new">
                Create your first post
              </Link>
            }
          />
        )}
      </SurfaceCard>
    </div>
  )
}

export default PostsPage

