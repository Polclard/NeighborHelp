import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  accessToken: null,
  currentUser: null,
  status: 'idle',
  refreshStatus: 'idle',
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionStarted(state, action) {
      state.accessToken = action.payload.accessToken ?? null
      state.currentUser = action.payload.user ?? null
      state.status = 'authenticated'
    },
    sessionCleared() {
      return initialState
    },
    authStatusChanged(state, action) {
      state.status = action.payload
    },
  },
})

export const { authStatusChanged, sessionCleared, sessionStarted } = authSlice.actions
export default authSlice.reducer
