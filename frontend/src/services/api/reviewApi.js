import { api } from './client.js'

export async function createReview(postId, values) {
  const { data } = await api.post(`/api/posts/${postId}/reviews`, values)
  return data
}

