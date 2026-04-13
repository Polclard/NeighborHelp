import { api } from './client.js'

export async function reportPost(postId, values) {
  const { data } = await api.post(`/api/posts/${postId}/report`, values)
  return data
}

export async function reportReview(reviewId, values) {
  const { data } = await api.post(`/api/reviews/${reviewId}/report`, values)
  return data
}

