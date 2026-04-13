import { api, publicApi } from './client.js'

export async function fetchBrowseFeed(filters) {
  const postsRequest = buildKeyword(filters?.keyword)
    ? publicApi.get('/api/posts/search', { params: buildBrowseParams(filters, true) })
    : publicApi.get('/api/posts', { params: buildBrowseParams(filters, false) })

  const markersRequest = publicApi.get('/api/posts/markers', {
    params: buildBrowseParams(filters, true),
  })

  const [{ data: posts }, { data: markers }] = await Promise.all([postsRequest, markersRequest])

  return { posts, markers }
}

export async function fetchPostById(postId) {
  const { data } = await publicApi.get(`/api/posts/${postId}`)
  return data
}

export async function fetchOwnPosts() {
  const { data } = await api.get('/api/users/me/posts')
  return data
}

export async function createPost(values) {
  const { data } = await api.post('/api/posts', values)
  return data
}

export async function updatePost(postId, values) {
  const { data } = await api.put(`/api/posts/${postId}`, values)
  return data
}

export async function deletePost(postId) {
  await api.delete(`/api/posts/${postId}`)
}

export async function uploadPostPhoto(postId, file) {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await api.post(`/api/posts/${postId}/photos`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return data
}

export async function deletePostPhoto(postId, photoId) {
  await api.delete(`/api/posts/${postId}/photos/${photoId}`)
}

export async function acceptRequest(postId) {
  const { data } = await api.post(`/api/posts/${postId}/accept`)
  return data
}

export async function updatePostStatus(postId, status) {
  const { data } = await api.patch(`/api/posts/${postId}/status`, { status })
  return data
}

function buildBrowseParams(filters, includeKeyword) {
  const keyword = buildKeyword(filters?.keyword)
  const params = {
    category: normalizeValue(filters?.category),
    postType: normalizeEnum(filters?.postType),
    status: normalizeEnum(filters?.status),
    latitude: undefined,
    longitude: undefined,
    radiusKm: undefined,
  }

  if (includeKeyword && keyword) {
    params.keyword = keyword
  }

  if (filters?.radiusKm && filters?.location) {
    params.latitude = Number(filters.location.latitude)
    params.longitude = Number(filters.location.longitude)
    params.radiusKm = Number(filters.radiusKm)
  }

  return params
}

function buildKeyword(value) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

function normalizeValue(value) {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function normalizeEnum(value) {
  return value && value !== 'ALL' ? value : undefined
}

