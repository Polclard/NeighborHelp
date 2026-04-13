import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  fetchOwnProfile as fetchOwnProfileRequest,
  fetchPublicProfile as fetchPublicProfileRequest,
  fetchUserReviews as fetchUserReviewsRequest,
  updateOwnProfile as updateOwnProfileRequest,
  uploadAvatar as uploadAvatarRequest,
} from '../../services/api/profileApi.js'
import { buildApiErrorPayload } from '../../utils/readApiMessage.js'

const initialState = {
  ownProfile: null,
  publicProfile: null,
  reviews: [],
  ownStatus: 'idle',
  publicStatus: 'idle',
  reviewsStatus: 'idle',
  saveStatus: 'idle',
  avatarStatus: 'idle',
  error: null,
}

export const fetchOwnProfile = createAsyncThunk(
  'profile/fetchOwnProfile',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchOwnProfileRequest()
    } catch (error) {
      return rejectWithValue(buildApiErrorPayload(error, 'Profile could not be loaded'))
    }
  },
)

export const updateOwnProfile = createAsyncThunk(
  'profile/updateOwnProfile',
  async (values, { rejectWithValue }) => {
    try {
      return await updateOwnProfileRequest(values)
    } catch (error) {
      return rejectWithValue(buildApiErrorPayload(error, 'Profile could not be updated'))
    }
  },
)

export const uploadAvatar = createAsyncThunk(
  'profile/uploadAvatar',
  async (file, { rejectWithValue }) => {
    try {
      return await uploadAvatarRequest(file)
    } catch (error) {
      return rejectWithValue(buildApiErrorPayload(error, 'Avatar could not be uploaded'))
    }
  },
)

export const fetchPublicProfile = createAsyncThunk(
  'profile/fetchPublicProfile',
  async (userId, { rejectWithValue }) => {
    try {
      return await fetchPublicProfileRequest(userId)
    } catch (error) {
      return rejectWithValue(buildApiErrorPayload(error, 'Public profile could not be loaded'))
    }
  },
)

export const fetchProfileReviews = createAsyncThunk(
  'profile/fetchProfileReviews',
  async (userId, { rejectWithValue }) => {
    try {
      return await fetchUserReviewsRequest(userId)
    } catch (error) {
      return rejectWithValue(buildApiErrorPayload(error, 'Reviews could not be loaded'))
    }
  },
)

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfileError(state) {
      state.error = null
    },
    clearPublicProfile(state) {
      state.publicProfile = null
      state.reviews = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOwnProfile.pending, (state) => {
        state.ownStatus = 'loading'
        state.error = null
      })
      .addCase(fetchOwnProfile.fulfilled, (state, action) => {
        state.ownStatus = 'ready'
        state.ownProfile = action.payload
      })
      .addCase(fetchOwnProfile.rejected, (state, action) => {
        state.ownStatus = 'error'
        state.error = action.payload?.message ?? 'Profile could not be loaded'
      })
      .addCase(updateOwnProfile.pending, (state) => {
        state.saveStatus = 'loading'
        state.error = null
      })
      .addCase(updateOwnProfile.fulfilled, (state, action) => {
        state.saveStatus = 'ready'
        state.ownProfile = action.payload
      })
      .addCase(updateOwnProfile.rejected, (state, action) => {
        state.saveStatus = 'error'
        state.error = action.payload?.message ?? 'Profile could not be updated'
      })
      .addCase(uploadAvatar.pending, (state) => {
        state.avatarStatus = 'loading'
        state.error = null
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.avatarStatus = 'ready'
        state.ownProfile = action.payload
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.avatarStatus = 'error'
        state.error = action.payload?.message ?? 'Avatar could not be uploaded'
      })
      .addCase(fetchPublicProfile.pending, (state) => {
        state.publicStatus = 'loading'
        state.error = null
      })
      .addCase(fetchPublicProfile.fulfilled, (state, action) => {
        state.publicStatus = 'ready'
        state.publicProfile = action.payload
      })
      .addCase(fetchPublicProfile.rejected, (state, action) => {
        state.publicStatus = 'error'
        state.error = action.payload?.message ?? 'Public profile could not be loaded'
      })
      .addCase(fetchProfileReviews.pending, (state) => {
        state.reviewsStatus = 'loading'
        state.error = null
      })
      .addCase(fetchProfileReviews.fulfilled, (state, action) => {
        state.reviewsStatus = 'ready'
        state.reviews = action.payload
      })
      .addCase(fetchProfileReviews.rejected, (state, action) => {
        state.reviewsStatus = 'error'
        state.error = action.payload?.message ?? 'Reviews could not be loaded'
      })
  },
})

export const { clearProfileError, clearPublicProfile } = profileSlice.actions
export default profileSlice.reducer
