import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  items: [],
  selectedPostId: null,
  filters: {
    category: '',
    keyword: '',
    postType: 'ALL',
    status: 'ALL',
  },
}

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    postsReceived(state, action) {
      state.items = action.payload
    },
    selectedPostChanged(state, action) {
      state.selectedPostId = action.payload
    },
    postFiltersChanged(state, action) {
      state.filters = { ...state.filters, ...action.payload }
    },
  },
})

export const { postFiltersChanged, postsReceived, selectedPostChanged } = postsSlice.actions
export default postsSlice.reducer
