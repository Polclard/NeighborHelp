import { api } from './client.js'

export async function fetchConversations() {
  const { data } = await api.get('/api/conversations')
  return data
}

export async function createConversation(values) {
  const { data } = await api.post('/api/conversations', values)
  return data
}

export async function fetchConversationMessages(conversationId, page = 0, size = 50) {
  const { data } = await api.get(`/api/conversations/${conversationId}/messages`, {
    params: { page, size },
  })
  return data
}

