import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BarChart from '../components/ui/BarChart.jsx'
import DataTable from '../components/ui/DataTable.jsx'
import DonutChart from '../components/ui/DonutChart.jsx'
import LineChart from '../components/ui/LineChart.jsx'
import MetricCard from '../components/ui/MetricCard.jsx'
import PaginationControls from '../components/ui/PaginationControls.jsx'
import SurfaceCard from '../components/ui/SurfaceCard.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import { formatEnumLabel, formatPostStatus, formatPostType } from '../constants/posts.js'
import {
  banUser,
  deleteModeratedPost,
  deleteUser,
  fetchAdminOverview,
  resolveReport,
  unbanUser,
} from '../features/admin/adminSlice.js'
import { useAppDispatch } from '../hooks/useAppDispatch.js'
import { useAppSelector } from '../hooks/useAppSelector.js'
import { useI18n } from '../i18n/useI18n.js'
import { formatDateTime } from '../utils/formatDateTime.js'
import styles from './AdminPage.module.css'

const PAGE_SIZE = 8

function AdminPage() {
  const dispatch = useAppDispatch()
  const { language, t } = useI18n()
  const { actionStatus, dashboard, error, posts, reports, status, users } = useAppSelector(
    (state) => state.admin,
  )
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('ALL')
  const [userAccessFilter, setUserAccessFilter] = useState('ALL')
  const [userPage, setUserPage] = useState(1)
  const [reportSearch, setReportSearch] = useState('')
  const [reportStatusFilter, setReportStatusFilter] = useState('OPEN')
  const [reportPage, setReportPage] = useState(1)
  const [postSearch, setPostSearch] = useState('')
  const [postTypeFilter, setPostTypeFilter] = useState('ALL')
  const [postStatusFilter, setPostStatusFilter] = useState('ALL')
  const [postPage, setPostPage] = useState(1)

  useEffect(() => {
    dispatch(fetchAdminOverview())
  }, [dispatch])

  const sortedUsers = sortByDateDesc(users)
  const sortedReports = sortByDateDesc(reports)
  const sortedPosts = sortByDateDesc(posts)

  const filteredUsers = sortedUsers.filter((user) => {
    const matchesSearch = matchesText(
      `${user.firstName} ${user.lastName} ${user.email}`,
      userSearch,
    )
    const matchesRole = userRoleFilter === 'ALL' || user.role === userRoleFilter
    const matchesAccess =
      userAccessFilter === 'ALL' ||
      (userAccessFilter === 'ACTIVE' && !user.isBanned) ||
      (userAccessFilter === 'BANNED' && user.isBanned)

    return matchesSearch && matchesRole && matchesAccess
  })

  const filteredReports = sortedReports.filter((report) => {
    const matchesSearch = matchesText(
      `${report.reportedPostTitle ?? ''} ${report.reporterEmail ?? ''} ${report.reason ?? ''}`,
      reportSearch,
    )
    const matchesStatus =
      reportStatusFilter === 'ALL' ||
      (reportStatusFilter === 'OPEN' && !report.resolved) ||
      (reportStatusFilter === 'RESOLVED' && report.resolved)

    return matchesSearch && matchesStatus
  })

  const filteredPosts = sortedPosts.filter((post) => {
    const matchesSearch = matchesText(`${post.title} ${post.category}`, postSearch)
    const matchesType = postTypeFilter === 'ALL' || post.postType === postTypeFilter
    const matchesStatus = postStatusFilter === 'ALL' || post.status === postStatusFilter

    return matchesSearch && matchesType && matchesStatus
  })

  const userTotalPages = getTotalPages(filteredUsers.length, PAGE_SIZE)
  const reportTotalPages = getTotalPages(filteredReports.length, PAGE_SIZE)
  const postTotalPages = getTotalPages(filteredPosts.length, PAGE_SIZE)
  const safeUserPage = clampPage(userPage, userTotalPages)
  const safeReportPage = clampPage(reportPage, reportTotalPages)
  const safePostPage = clampPage(postPage, postTotalPages)

  const paginatedUsers = paginateRows(filteredUsers, safeUserPage, PAGE_SIZE)
  const paginatedReports = paginateRows(filteredReports, safeReportPage, PAGE_SIZE)
  const paginatedPosts = paginateRows(filteredPosts, safePostPage, PAGE_SIZE)

  const roleOptions = ['ALL', ...new Set(users.map((user) => user.role).filter(Boolean))]
  const postStatusOptions = ['ALL', ...new Set(posts.map((post) => post.status).filter(Boolean))]

  const accessChartItems = [
    { label: t('admin.users.active'), value: users.filter((user) => !user.isBanned).length, color: '#1f6f57' },
    { label: t('admin.users.banned'), value: users.filter((user) => user.isBanned).length, color: '#d7662f' },
  ]

  const roleChartItems = roleOptions
    .filter((role) => role !== 'ALL')
    .map((role) => ({
      label: formatEnumLabel(role, t),
      value: users.filter((user) => user.role === role).length,
      color: role === 'ROLE_ADMIN' ? '#d7662f' : '#1f6f57',
    }))

  const postMixItems = [
    {
      label: t('posts.type.requests'),
      value: posts.filter((post) => post.postType === 'SERVICE_REQUEST').length,
      color: '#d7662f',
    },
    {
      label: t('posts.type.offers'),
      value: posts.filter((post) => post.postType === 'SERVICE_OFFER').length,
      color: '#1f6f57',
    },
  ]

  const moderationLoadItems = [
    { label: t('admin.metric.openReports'), value: dashboard?.unresolvedReports ?? 0, color: '#d7662f' },
    {
      label: t('common.actions.resolved'),
      value: reports.filter((report) => report.resolved).length,
      color: '#6d7f7e',
    },
    { label: t('admin.metric.activePosts'), value: dashboard?.activePosts ?? 0, color: '#1f6f57' },
    { label: t('admin.metric.bannedUsers'), value: dashboard?.bannedUsers ?? 0, color: '#8f5d44' },
  ]

  const recentActivityPoints = buildRecentActivityPoints(users, reports, posts, language)

  return (
    <div className={styles.page}>
      <SurfaceCard
        eyebrow={t('admin.eyebrow')}
        title={t('admin.title')}
        description={t('admin.description')}
        actions={<Link className={styles.secondaryAction} to="/map">{t('admin.backToMap')}</Link>}
      >
        {error ? <p className={styles.error}>{error}</p> : null}

        {status === 'loading' && !dashboard ? (
          <p className={styles.copy}>{t('admin.loading')}</p>
        ) : dashboard ? (
          <>
            <div className={styles.metrics}>
              <MetricCard label={t('admin.metric.activeUsers')} value={dashboard.totalActiveUsers} caption={t('admin.metric.activeUsersCaption')} />
              <MetricCard label={t('admin.metric.bannedUsers')} value={dashboard.bannedUsers} caption={t('admin.metric.bannedUsersCaption')} />
              <MetricCard label={t('admin.metric.activePosts')} value={dashboard.activePosts} caption={t('admin.metric.activePostsCaption')} />
              <MetricCard label={t('admin.metric.activeReviews')} value={dashboard.activeReviews} caption={t('admin.metric.activeReviewsCaption')} />
              <MetricCard label={t('admin.metric.openReports')} value={dashboard.unresolvedReports} caption={t('admin.metric.openReportsCaption')} />
            </div>

            <div className={styles.analyticsGrid}>
              <article className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <p className={styles.chartEyebrow}>{t('admin.analytics.usersEyebrow')}</p>
                  <h3>{t('admin.analytics.userAccessTitle')}</h3>
                </div>
                <DonutChart
                  items={accessChartItems}
                  centerCaption={t('admin.metric.activeUsers')}
                  centerLabel={String(users.length)}
                />
              </article>

              <article className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <p className={styles.chartEyebrow}>{t('admin.analytics.usersEyebrow')}</p>
                  <h3>{t('admin.analytics.rolesTitle')}</h3>
                </div>
                <BarChart items={roleChartItems} />
              </article>

              <article className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <p className={styles.chartEyebrow}>{t('admin.analytics.postsEyebrow')}</p>
                  <h3>{t('admin.analytics.postMixTitle')}</h3>
                </div>
                <DonutChart
                  items={postMixItems}
                  centerCaption={t('admin.metric.activePosts')}
                  centerLabel={String(posts.length)}
                />
              </article>

              <article className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <p className={styles.chartEyebrow}>{t('admin.analytics.moderationEyebrow')}</p>
                  <h3>{t('admin.analytics.moderationLoadTitle')}</h3>
                </div>
                <BarChart items={moderationLoadItems} />
              </article>

              <article className={`${styles.chartCard} ${styles.chartCardWide}`}>
                <div className={styles.chartHeader}>
                  <p className={styles.chartEyebrow}>{t('admin.analytics.activityEyebrow')}</p>
                  <h3>{t('admin.analytics.recentActivityTitle')}</h3>
                </div>
                <LineChart points={recentActivityPoints} />
              </article>
            </div>
          </>
        ) : null}
      </SurfaceCard>

      <SurfaceCard title={t('admin.usersTitle')} description={t('admin.usersDescription')}>
        <div className={styles.toolbar}>
          <label className={styles.filterField}>
            <span>{t('admin.filters.search')}</span>
            <input
              type="search"
              value={userSearch}
              placeholder={t('admin.filters.searchUsersPlaceholder')}
              onChange={(event) => {
                setUserSearch(event.target.value)
                setUserPage(1)
              }}
            />
          </label>

          <label className={styles.filterField}>
            <span>{t('admin.filters.role')}</span>
            <select
              value={userRoleFilter}
              onChange={(event) => {
                setUserRoleFilter(event.target.value)
                setUserPage(1)
              }}
            >
              <option value="ALL">{t('common.any')}</option>
              {roleOptions
                .filter((role) => role !== 'ALL')
                .map((role) => (
                  <option key={role} value={role}>
                    {formatEnumLabel(role, t)}
                  </option>
                ))}
            </select>
          </label>

          <label className={styles.filterField}>
            <span>{t('admin.filters.access')}</span>
            <select
              value={userAccessFilter}
              onChange={(event) => {
                setUserAccessFilter(event.target.value)
                setUserPage(1)
              }}
            >
              <option value="ALL">{t('common.any')}</option>
              <option value="ACTIVE">{t('admin.users.active')}</option>
              <option value="BANNED">{t('admin.users.banned')}</option>
            </select>
          </label>
        </div>

        <DataTable
          columns={[
            {
              key: 'name',
              header: t('admin.users.column.user'),
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
              header: t('admin.users.column.role'),
              render: (user) => <StatusBadge value={user.role} />,
            },
            {
              key: 'banned',
              header: t('admin.users.column.access'),
              render: (user) =>
                user.isBanned ? <StatusBadge value="CANCELLED" label={t('admin.users.banned')} /> : <StatusBadge value="SERVICE_DONE" label={t('admin.users.active')} />,
            },
            {
              key: 'createdAt',
              header: t('admin.users.column.joined'),
              render: (user) => formatDateTime(user.createdAt),
            },
            {
              key: 'actions',
              header: t('admin.users.column.actions'),
              render: (user) => (
                <div className={styles.tableActions}>
                  {user.isBanned ? (
                    <button
                      className={styles.secondaryAction}
                      type="button"
                      disabled={actionStatus === 'loading'}
                      onClick={() => dispatch(unbanUser(user.id))}
                    >
                      {t('common.actions.unban')}
                    </button>
                  ) : (
                    <button
                      className={styles.secondaryAction}
                      type="button"
                      disabled={actionStatus === 'loading'}
                      onClick={() => dispatch(banUser(user.id))}
                    >
                      {t('common.actions.ban')}
                    </button>
                  )}
                  <button
                    className={styles.dangerAction}
                    type="button"
                    disabled={actionStatus === 'loading'}
                    onClick={() => dispatch(deleteUser(user.id))}
                  >
                    {t('common.actions.delete')}
                  </button>
                </div>
              ),
            },
          ]}
          emptyDescription={t('admin.users.emptyDescription')}
          emptyTitle={t('admin.users.emptyTitle')}
          rowKey="id"
          rows={paginatedUsers}
        />

        <PaginationControls
          page={safeUserPage}
          totalPages={userTotalPages}
          onPageChange={setUserPage}
          previousLabel={t('common.actions.previous')}
          nextLabel={t('common.actions.next')}
          summary={buildPaginationSummary(safeUserPage, PAGE_SIZE, filteredUsers.length, t)}
        />
      </SurfaceCard>

      <SurfaceCard title={t('admin.reportsTitle')} description={t('admin.reportsDescription')}>
        <div className={styles.toolbar}>
          <label className={styles.filterField}>
            <span>{t('admin.filters.search')}</span>
            <input
              type="search"
              value={reportSearch}
              placeholder={t('admin.filters.searchReportsPlaceholder')}
              onChange={(event) => {
                setReportSearch(event.target.value)
                setReportPage(1)
              }}
            />
          </label>

          <label className={styles.filterField}>
            <span>{t('admin.filters.reportStatus')}</span>
            <select
              value={reportStatusFilter}
              onChange={(event) => {
                setReportStatusFilter(event.target.value)
                setReportPage(1)
              }}
            >
              <option value="ALL">{t('common.any')}</option>
              <option value="OPEN">{t('admin.reports.open')}</option>
              <option value="RESOLVED">{t('common.actions.resolved')}</option>
            </select>
          </label>
        </div>

        <DataTable
          columns={[
            {
              key: 'target',
              header: t('admin.reports.column.target'),
              render: (report) => (
                <div>
                  <strong>{report.reportedPostTitle || t('admin.reviewTarget', { rating: report.reportedReviewRating ?? '' })}</strong>
                  <p className={styles.subtle}>{report.reporterEmail}</p>
                </div>
              ),
            },
            {
              key: 'reason',
              header: t('admin.reports.column.reason'),
              render: (report) => report.reason,
            },
            {
              key: 'createdAt',
              header: t('admin.reports.column.submitted'),
              render: (report) => formatDateTime(report.createdAt),
            },
            {
              key: 'actions',
              header: t('admin.users.column.actions'),
              render: (report) => (
                <button
                  className={styles.primaryAction}
                  type="button"
                  disabled={actionStatus === 'loading' || report.resolved}
                  onClick={() => dispatch(resolveReport(report.id))}
                >
                  {report.resolved ? t('common.actions.resolved') : t('common.actions.resolve')}
                </button>
              ),
            },
          ]}
          emptyDescription={t('admin.reports.emptyDescription')}
          emptyTitle={t('admin.reports.emptyTitle')}
          rowKey="id"
          rows={paginatedReports}
        />

        <PaginationControls
          page={safeReportPage}
          totalPages={reportTotalPages}
          onPageChange={setReportPage}
          previousLabel={t('common.actions.previous')}
          nextLabel={t('common.actions.next')}
          summary={buildPaginationSummary(safeReportPage, PAGE_SIZE, filteredReports.length, t)}
        />
      </SurfaceCard>

      <SurfaceCard title={t('admin.postsTitle')} description={t('admin.postsDescription')}>
        <div className={styles.toolbar}>
          <label className={styles.filterField}>
            <span>{t('admin.filters.search')}</span>
            <input
              type="search"
              value={postSearch}
              placeholder={t('admin.filters.searchPostsPlaceholder')}
              onChange={(event) => {
                setPostSearch(event.target.value)
                setPostPage(1)
              }}
            />
          </label>

          <label className={styles.filterField}>
            <span>{t('admin.filters.postType')}</span>
            <select
              value={postTypeFilter}
              onChange={(event) => {
                setPostTypeFilter(event.target.value)
                setPostPage(1)
              }}
            >
              <option value="ALL">{t('common.any')}</option>
              <option value="SERVICE_REQUEST">{t('posts.type.requests')}</option>
              <option value="SERVICE_OFFER">{t('posts.type.offers')}</option>
            </select>
          </label>

          <label className={styles.filterField}>
            <span>{t('admin.filters.postStatus')}</span>
            <select
              value={postStatusFilter}
              onChange={(event) => {
                setPostStatusFilter(event.target.value)
                setPostPage(1)
              }}
            >
              <option value="ALL">{t('common.any')}</option>
              {postStatusOptions
                .filter((value) => value !== 'ALL')
                .map((value) => (
                  <option key={value} value={value}>
                    {formatPostStatus(value, t)}
                  </option>
                ))}
            </select>
          </label>
        </div>

        <DataTable
          columns={[
            {
              key: 'title',
              header: t('admin.posts.column.post'),
              render: (post) => (
                <div>
                  <strong>{post.title}</strong>
                  <p className={styles.subtle}>{post.category}</p>
                </div>
              ),
            },
            {
              key: 'type',
              header: t('admin.posts.column.type'),
              render: (post) => <StatusBadge value={post.postType} label={formatPostType(post.postType, t)} />,
            },
            {
              key: 'status',
              header: t('admin.posts.column.status'),
              render: (post) => <StatusBadge value={post.status} label={formatPostStatus(post.status, t)} />,
            },
            {
              key: 'createdAt',
              header: t('admin.posts.column.created'),
              render: (post) => formatDateTime(post.createdAt),
            },
            {
              key: 'actions',
              header: t('admin.posts.column.actions'),
              render: (post) => (
                <div className={styles.tableActions}>
                  <Link className={styles.secondaryAction} to={`/posts/${post.id}`}>
                    {t('common.actions.openDetails')}
                  </Link>
                  <button
                    className={styles.dangerAction}
                    type="button"
                    disabled={actionStatus === 'loading'}
                    onClick={() => dispatch(deleteModeratedPost(post.id))}
                  >
                    {t('common.actions.delete')}
                  </button>
                </div>
              ),
            },
          ]}
          emptyDescription={t('admin.posts.emptyDescription')}
          emptyTitle={t('admin.posts.emptyTitle')}
          rowKey="id"
          rows={paginatedPosts}
        />

        <PaginationControls
          page={safePostPage}
          totalPages={postTotalPages}
          onPageChange={setPostPage}
          previousLabel={t('common.actions.previous')}
          nextLabel={t('common.actions.next')}
          summary={buildPaginationSummary(safePostPage, PAGE_SIZE, filteredPosts.length, t)}
        />
      </SurfaceCard>
    </div>
  )
}

function matchesText(value, search) {
  const normalizedSearch = search.trim().toLowerCase()

  if (!normalizedSearch) {
    return true
  }

  return value.toLowerCase().includes(normalizedSearch)
}

function sortByDateDesc(rows) {
  return [...rows].sort((left, right) => {
    const leftDate = new Date(left.createdAt ?? left.updatedAt ?? 0).getTime()
    const rightDate = new Date(right.createdAt ?? right.updatedAt ?? 0).getTime()
    return rightDate - leftDate
  })
}

function paginateRows(rows, page, pageSize) {
  const start = (page - 1) * pageSize
  return rows.slice(start, start + pageSize)
}

function getTotalPages(count, pageSize) {
  return Math.max(1, Math.ceil(count / pageSize))
}

function clampPage(page, totalPages) {
  return Math.max(1, Math.min(page, totalPages))
}

function buildPaginationSummary(page, pageSize, total, t) {
  if (!total) {
    return t('admin.pagination.empty')
  }

  const start = (page - 1) * pageSize + 1
  const end = Math.min(total, start + pageSize - 1)

  return t('admin.pagination.summary', { start, end, total })
}

function buildRecentActivityPoints(users, reports, posts, language) {
  const formatter = new Intl.DateTimeFormat(language === 'mk' ? 'mk-MK' : 'en-US', { weekday: 'short' })
  const rows = [...users, ...reports, ...posts]
  const points = []

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - index)

    const nextDate = new Date(date)
    nextDate.setDate(date.getDate() + 1)

    const value = rows.filter((row) => {
      const createdAt = new Date(row.createdAt ?? 0).getTime()
      return createdAt >= date.getTime() && createdAt < nextDate.getTime()
    }).length

    points.push({
      label: formatter.format(date),
      value,
    })
  }

  return points
}

export default AdminPage
