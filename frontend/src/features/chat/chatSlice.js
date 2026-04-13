import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  createConversation as createConversationRequest,
  fetchConversationMessages as fetchConversationMessagesRequest,
  fetchConversations as fetchConversationsRequest,
} from '../../services/api/chatApi.js'
import { logoutUser } from '../auth/authSlice.js'
import { buildApiErrorPayload } from '../../utils/readApiMessage.js'

const initialState = {
  connectionStatus: 'idle',
  conversations: [],
  activeConversationId: null,
  messagesByConversation: {},
  messagesStatusByConversation: {},
  conversationsStatus: 'idle',
  createStatus: 'idle',
  error: null,
}

export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchConversationsRequest()
    } catch (error) {
      return rejectWithValue(buildApiErrorPayload(error, 'Conversations could not be loaded'))
    }
  },
)

export const createConversation = createAsyncThunk(
  'chat/createConversation',
  async (values, { rejectWithValue }) => {
    try {
      return await createConversationRequest(values)
    } catch (error) {
      return rejectWithValue(buildApiErrorPayload(error, 'Conversation could not be started'))
    }
  },
)

export const fetchConversationMessages = createAsyncThunk(
  'chat/fetchConversationMessages',
  async ({ conversationId, page = 0, size = 50 }, { rejectWithValue }) => {
    try {
      const data = await fetchConversationMessagesRequest(conversationId, page, size)
      return { conversationId, pageData: data }
    } catch (error) {
      return rejectWithValue(buildApiErrorPayload(error, 'Messages could not be loaded'))
    }
  },
)

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    chatConnectionStatusChanged(state, action) {
      state.connectionStatus = action.payload
    },
    activeConversationChanged(state, action) {
      state.activeConversationId = action.payload

      if (!action.payload) {
        return
      }

      const conversation = state.conversations.find((item) => item.id === action.payload)
      if (conversation) {
        conversation.unreadCount = 0
      }
    },
    messageReceived(state, action) {
      const { message, viewerId } = action.payload
      const list = state.messagesByConversation[message.conversationId] ?? []

      if (!list.some((item) => item.id === message.id)) {
        state.messagesByConversation[message.conversationId] = [...list, message]
      }

      const conversation = state.conversations.find((item) => item.id === message.conversationId)
      if (conversation) {
        conversation.lastMessagePreview = message.content || 'Image'
        conversation.lastMessageAt = message.sentAt

        if (state.activeConversationId !== message.conversationId && message.senderId !== viewerId) {
          conversation.unreadCount = (conversation.unreadCount ?? 0) + 1
        }
      }

      sortConversations(state.conversations)
    },
    clearChatError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logoutUser.fulfilled, () => ({ ...initialState }))
      .addCase(logoutUser.rejected, () => ({ ...initialState }))
      .addCase(fetchConversations.pending, (state) => {
        state.conversationsStatus = 'loading'
        state.error = null
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.conversationsStatus = 'ready'
        state.conversations = action.payload.map((conversation) =>
          mergeConversation(state.conversations, conversation),
        )

        sortConversations(state.conversations)
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.conversationsStatus = 'error'
        state.error = action.payload?.message ?? 'Conversations could not be loaded'
      })
      .addCase(createConversation.pending, (state) => {
        state.createStatus = 'loading'
        state.error = null
      })
      .addCase(createConversation.fulfilled, (state, action) => {
        state.createStatus = 'ready'

        const existingIndex = state.conversations.findIndex((item) => item.id === action.payload.id)
        const nextConversation = mergeConversation(state.conversations, action.payload)

        if (existingIndex >= 0) {
          state.conversations[existingIndex] = nextConversation
        } else {
          state.conversations.unshift(nextConversation)
        }

        state.activeConversationId = action.payload.id
        sortConversations(state.conversations)
      })
      .addCase(createConversation.rejected, (state, action) => {
        state.createStatus = 'error'
        state.error = action.payload?.message ?? 'Conversation could not be started'
      })
      .addCase(fetchConversationMessages.pending, (state, action) => {
        state.messagesStatusByConversation[action.meta.arg.conversationId] = 'loading'
        state.error = null
      })
      .addCase(fetchConversationMessages.fulfilled, (state, action) => {
        const { conversationId, pageData } = action.payload
        state.messagesStatusByConversation[conversationId] = 'ready'
        state.messagesByConversation[conversationId] = pageData.content

        const conversation = state.conversations.find((item) => item.id === conversationId)
        if (conversation) {
          conversation.unreadCount = 0

          const latestMessage = pageData.content[pageData.content.length - 1]
          if (latestMessage) {
            conversation.lastMessagePreview = latestMessage.content || 'Image'
            conversation.lastMessageAt = latestMessage.sentAt
          }
        }

        sortConversations(state.conversations)
      })
      .addCase(fetchConversationMessages.rejected, (state, action) => {
        state.messagesStatusByConversation[action.meta.arg.conversationId] = 'error'
        state.error = action.payload?.message ?? 'Messages could not be loaded'
      })
  },
})

function mergeConversation(existingConversations, incomingConversation) {
  const previous = existingConversations.find((item) => item.id === incomingConversation.id)

  return {
    ...incomingConversation,
    unreadCount: previous?.unreadCount ?? 0,
    lastMessagePreview: previous?.lastMessagePreview ?? null,
    lastMessageAt: previous?.lastMessageAt ?? incomingConversation.createdAt,
  }
}

function sortConversations(conversations) {
  conversations.sort((left, right) => {
    const rightDate = right.lastMessageAt ?? right.createdAt
    const leftDate = left.lastMessageAt ?? left.createdAt
    return new Date(rightDate).getTime() - new Date(leftDate).getTime()
  })
}

export const {
  activeConversationChanged,
  chatConnectionStatusChanged,
  clearChatError,
  messageReceived,
} = chatSlice.actions
export default chatSlice.reducer
