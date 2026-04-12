import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  connectionStatus: 'idle',
  conversations: [],
  activeConversationId: null,
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    chatConnectionStatusChanged(state, action) {
      state.connectionStatus = action.payload
    },
    conversationsReceived(state, action) {
      state.conversations = action.payload
    },
    activeConversationChanged(state, action) {
      state.activeConversationId = action.payload
    },
  },
})

export const {
  activeConversationChanged,
  chatConnectionStatusChanged,
  conversationsReceived,
} = chatSlice.actions
export default chatSlice.reducer
