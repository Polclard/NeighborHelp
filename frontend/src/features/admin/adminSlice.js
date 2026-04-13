import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  banUser as banUserRequest,
  deleteAdminPost as deleteAdminPostRequest,
  deleteUser as deleteUserRequest,
  fetchAdminDashboard,
  fetchAdminPosts,
  fetchAdminReports,
  fetchAdminUsers,
  resolveReport as resolveReportRequest,
  unbanUser as unbanUserRequest,
} from '../../services/api/adminApi.js'
import { buildApiErrorPayload } from '../../utils/readApiMessage.js'

const initialState = {
  dashboard: null,
  users: [],
  reports: [],
  posts: [],
  status: 'idle',
  actionStatus: 'idle',
  error: null,
}

export const fetchAdminOverview = createAsyncThunk(
  'admin/fetchAdminOverview',
  async (_, { rejectWithValue }) => {
    try {
      const [dashboard, users, reports, posts] = await Promise.all([
        fetchAdminDashboard(),
        fetchAdminUsers(),
        fetchAdminReports(),
        fetchAdminPosts(),
      ])

      return { dashboard, users, reports, posts }
    } catch (error) {
      return rejectWithValue(buildApiErrorPayload(error, 'Admin dashboard could not be loaded'))
    }
  },
)

export const banUser = createAsyncThunk(
  'admin/banUser',
  async (userId, { rejectWithValue }) => {
    try {
      return await banUserRequest(userId)
    } catch (error) {
      return rejectWithValue(buildApiErrorPayload(error, 'User could not be banned'))
    }
  },
)

export const unbanUser = createAsyncThunk(
  'admin/unbanUser',
  async (userId, { rejectWithValue }) => {
    try {
      return await unbanUserRequest(userId)
    } catch (error) {
      return rejectWithValue(buildApiErrorPayload(error, 'User could not be unbanned'))
    }
  },
)

export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      await deleteUserRequest(userId)
      return userId
    } catch (error) {
      return rejectWithValue(buildApiErrorPayload(error, 'User could not be deleted'))
    }
  },
)

export const resolveReport = createAsyncThunk(
  'admin/resolveReport',
  async (reportId, { rejectWithValue }) => {
    try {
      return await resolveReportRequest(reportId)
    } catch (error) {
      return rejectWithValue(buildApiErrorPayload(error, 'Report could not be resolved'))
    }
  },
)

export const deleteModeratedPost = createAsyncThunk(
  'admin/deleteModeratedPost',
  async (postId, { rejectWithValue }) => {
    try {
      await deleteAdminPostRequest(postId)
      return postId
    } catch (error) {
      return rejectWithValue(buildApiErrorPayload(error, 'Post could not be deleted'))
    }
  },
)

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearAdminError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminOverview.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchAdminOverview.fulfilled, (state, action) => {
        state.status = 'ready'
        state.dashboard = action.payload.dashboard
        state.users = action.payload.users
        state.reports = action.payload.reports
        state.posts = action.payload.posts
      })
      .addCase(fetchAdminOverview.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.payload?.message ?? 'Admin dashboard could not be loaded'
      })
      .addCase(banUser.pending, (state) => {
        state.actionStatus = 'loading'
        state.error = null
      })
      .addCase(banUser.fulfilled, (state, action) => {
        state.actionStatus = 'ready'
        replaceUser(state.users, action.payload)
      })
      .addCase(banUser.rejected, (state, action) => {
        state.actionStatus = 'error'
        state.error = action.payload?.message ?? 'User could not be banned'
      })
      .addCase(unbanUser.pending, (state) => {
        state.actionStatus = 'loading'
        state.error = null
      })
      .addCase(unbanUser.fulfilled, (state, action) => {
        state.actionStatus = 'ready'
        replaceUser(state.users, action.payload)
      })
      .addCase(unbanUser.rejected, (state, action) => {
        state.actionStatus = 'error'
        state.error = action.payload?.message ?? 'User could not be unbanned'
      })
      .addCase(deleteUser.pending, (state) => {
        state.actionStatus = 'loading'
        state.error = null
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.actionStatus = 'ready'
        state.users = state.users.filter((user) => user.id !== action.payload)
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.actionStatus = 'error'
        state.error = action.payload?.message ?? 'User could not be deleted'
      })
      .addCase(resolveReport.pending, (state) => {
        state.actionStatus = 'loading'
        state.error = null
      })
      .addCase(resolveReport.fulfilled, (state, action) => {
        state.actionStatus = 'ready'
        replaceReport(state.reports, action.payload)
      })
      .addCase(resolveReport.rejected, (state, action) => {
        state.actionStatus = 'error'
        state.error = action.payload?.message ?? 'Report could not be resolved'
      })
      .addCase(deleteModeratedPost.pending, (state) => {
        state.actionStatus = 'loading'
        state.error = null
      })
      .addCase(deleteModeratedPost.fulfilled, (state, action) => {
        state.actionStatus = 'ready'
        state.posts = state.posts.filter((post) => post.id !== action.payload)
      })
      .addCase(deleteModeratedPost.rejected, (state, action) => {
        state.actionStatus = 'error'
        state.error = action.payload?.message ?? 'Post could not be deleted'
      })
  },
})

function replaceUser(users, user) {
  const index = users.findIndex((item) => item.id === user.id)

  if (index >= 0) {
    users[index] = user
  }
}

function replaceReport(reports, report) {
  const index = reports.findIndex((item) => item.id === report.id)

  if (index >= 0) {
    reports[index] = report
  }
}

export const { clearAdminError } = adminSlice.actions
export default adminSlice.reducer
