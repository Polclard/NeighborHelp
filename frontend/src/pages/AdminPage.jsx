import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import DataTable from '../components/ui/DataTable.jsx'
import MetricCard from '../components/ui/MetricCard.jsx'
import SurfaceCard from '../components/ui/SurfaceCard.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import {
  banUser,
  deleteModeratedPost,
  deleteUser,
  fetchAdminOverview,
  resolveReport,
  unbanUser,
} from '../features/admin/adminSlice.js'
import { formatDateTime } from '../utils/formatDateTime.js'
import { useAppDispatch } from '../hooks/useAppDispatch.js'
import { useAppSelector } from '../hooks/useAppSelector.js'
import styles from './AdminPage.module.css'

function AdminPage() {
  const dispatch = useAppDispatch()
  const { actionStatus, dashboard, error, posts, reports, status, users } = useAppSelector(
    (state) => state.admin,
  )

  useEffect(() => {
    dispatch(fetchAdminOverview())
  }, [dispatch])

  return (
    <div className={styles.page}>
      <SurfaceCard
        eyebrow="Admin"
        title="Moderation control room"
        description="Dashboard stats, user moderation, report handling, and post deletion now sit behind the admin-only route."
        actions={<Link className={styles.secondaryAction} to="/map">Back to map</Link>}
      >
        {error ? <p className={styles.error}>{error}</p> : null}

        {status === 'loading' && !dashboard ? (
          <p className={styles.copy}>Loading admin overview...</p>
        ) : dashboard ? (
          <div className={styles.metrics}>
            <MetricCard label="Active users" value={dashboard.totalActiveUsers} caption="All non-deleted accounts." />
            <MetricCard label="Banned users" value={dashboard.bannedUsers} caption="Accounts currently blocked from participation." />
            <MetricCard label="Active posts" value={dashboard.activePosts} caption="Requests and offers currently stored in the system." />
            <MetricCard label="Active reviews" value={dashboard.activeReviews} caption="Public trust signals attached to users." />
            <MetricCard label="Open reports" value={dashboard.unresolvedReports} caption="Items still waiting for a moderation decision." />
          </div>
        ) : null}
      </SurfaceCard>

      <SurfaceCard title="Users" description="Ban, unban, or soft-delete user accounts.">
        <DataTable
          columns={[
            {
              key: 'name',
              header: 'User',
              render: (user) => (
                <div>
                  <strong>
                    {user.firstName} {user.lastName}
                  </strong>
                  <p className={styles.subtle}>{user.email}</p>
                </div>
              ),
            },
            {
              key: 'role',
              header: 'Role',
              render: (user) => <StatusBadge value={user.role} label={user.role.replace('ROLE_', '')} />,
            },
            {
              key: 'banned',
              header: 'Access',
              render: (user) =>
                user.isBanned ? <StatusBadge value="CANCELLED" label="Banned" /> : <StatusBadge value="SERVICE_DONE" label="Active" />,
            },
            {
              key: 'createdAt',
              header: 'Joined',
              render: (user) => formatDateTime(user.createdAt),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (user) => (
                <div className={styles.tableActions}>
                  {user.isBanned ? (
                    <button
                      className={styles.secondaryAction}
                      type="button"
                      disabled={actionStatus === 'loading'}
                      onClick={() => dispatch(unbanUser(user.id))}
                    >
                      Unban
                    </button>
                  ) : (
                    <button
                      className={styles.secondaryAction}
                      type="button"
                      disabled={actionStatus === 'loading'}
                      onClick={() => dispatch(banUser(user.id))}
                    >
                      Ban
                    </button>
                  )}
                  <button
                    className={styles.dangerAction}
                    type="button"
                    disabled={actionStatus === 'loading'}
                    onClick={() => dispatch(deleteUser(user.id))}
                  >
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
          emptyDescription="No users have been returned by the admin API."
          emptyTitle="No users"
          rowKey="id"
          rows={users}
        />
      </SurfaceCard>

      <SurfaceCard title="Open reports" description="Resolve reports after reviewing the attached context.">
        <DataTable
          columns={[
            {
              key: 'target',
              header: 'Target',
              render: (report) => (
                <div>
                  <strong>{report.reportedPostTitle || `Review ${report.reportedReviewRating ?? ''}`}</strong>
                  <p className={styles.subtle}>{report.reporterEmail}</p>
                </div>
              ),
            },
            {
              key: 'reason',
              header: 'Reason',
              render: (report) => report.reason,
            },
            {
              key: 'createdAt',
              header: 'Submitted',
              render: (report) => formatDateTime(report.createdAt),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (report) => (
                <button
                  className={styles.primaryAction}
                  type="button"
                  disabled={actionStatus === 'loading' || report.resolved}
                  onClick={() => dispatch(resolveReport(report.id))}
                >
                  {report.resolved ? 'Resolved' : 'Resolve'}
                </button>
              ),
            },
          ]}
          emptyDescription="Open reports will appear here when users flag posts or reviews."
          emptyTitle="No open reports"
          rowKey="id"
          rows={reports}
        />
      </SurfaceCard>

      <SurfaceCard title="Posts" description="Delete posts directly when moderation requires immediate action.">
        <DataTable
          columns={[
            {
              key: 'title',
              header: 'Post',
              render: (post) => (
                <div>
                  <strong>{post.title}</strong>
                  <p className={styles.subtle}>{post.category}</p>
                </div>
              ),
            },
            {
              key: 'type',
              header: 'Type',
              render: (post) => <StatusBadge value={post.postType} />,
            },
            {
              key: 'status',
              header: 'Status',
              render: (post) => <StatusBadge value={post.status} />,
            },
            {
              key: 'createdAt',
              header: 'Created',
              render: (post) => formatDateTime(post.createdAt),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (post) => (
                <div className={styles.tableActions}>
                  <Link className={styles.secondaryAction} to={`/posts/${post.id}`}>
                    Open
                  </Link>
                  <button
                    className={styles.dangerAction}
                    type="button"
                    disabled={actionStatus === 'loading'}
                    onClick={() => dispatch(deleteModeratedPost(post.id))}
                  >
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
          emptyDescription="There are no posts to moderate right now."
          emptyTitle="No posts"
          rowKey="id"
          rows={posts}
        />
      </SurfaceCard>
    </div>
  )
}

export default AdminPage

