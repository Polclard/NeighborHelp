import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  currentProfile: null,
  reviews: [],
  status: 'idle',
}

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    profileReceived(state, action) {
      state.currentProfile = action.payload
      state.status = 'ready'
    },
    profileReviewsReceived(state, action) {
      state.reviews = action.payload
    },
  },
})

export const { profileReceived, profileReviewsReceived } = profileSlice.actions
export default profileSlice.reducer
