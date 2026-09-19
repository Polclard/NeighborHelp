import { api, publicApi } from './client.js'

export async function fetchOwnProfile() {
  const { data } = await api.get('/api/users/me')
  return data
}

export async function updateOwnProfile(values) {
  const { data } = await api.put('/api/users/me', values)
  return data
}

export async function changePassword(values) {
  const { data } = await api.put('/api/users/me/password', values)
  return data
}

export async function uploadAvatar(file) {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await api.post('/api/users/me/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return data
}

export async function fetchPublicProfile(userId) {
  const { data } = await publicApi.get(`/api/profiles/${userId}`)
  return data
}

export async function fetchUserReviews(userId) {
  const { data } = await publicApi.get(`/api/profiles/${userId}/reviews`)
  return data
}

