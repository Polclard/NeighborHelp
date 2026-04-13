import { api } from './client.js'

export async function fetchAdminDashboard() {
  const { data } = await api.get('/api/admin/dashboard')
  return data
}

export async function fetchAdminUsers() {
  const { data } = await api.get('/api/admin/users')
  return data
}

export async function fetchAdminReports() {
  const { data } = await api.get('/api/admin/reports')
  return data
}

export async function fetchAdminPosts() {
  const { data } = await api.get('/api/admin/posts')
  return data
}

export async function banUser(userId) {
  const { data } = await api.patch(`/api/admin/users/${userId}/ban`)
  return data
}

export async function unbanUser(userId) {
  const { data } = await api.patch(`/api/admin/users/${userId}/unban`)
  return data
}

export async function deleteUser(userId) {
  await api.delete(`/api/admin/users/${userId}`)
}

export async function resolveReport(reportId) {
  const { data } = await api.patch(`/api/admin/reports/${reportId}/resolve`)
  return data
}

export async function deleteAdminPost(postId) {
  await api.delete(`/api/admin/posts/${postId}`)
}

