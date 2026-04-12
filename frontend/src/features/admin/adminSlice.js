import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  dashboard: null,
  users: [],
  reports: [],
}

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    adminDashboardReceived(state, action) {
      state.dashboard = action.payload
    },
    adminUsersReceived(state, action) {
      state.users = action.payload
    },
    adminReportsReceived(state, action) {
      state.reports = action.payload
    },
  },
})

export const { adminDashboardReceived, adminReportsReceived, adminUsersReceived } =
  adminSlice.actions
export default adminSlice.reducer
