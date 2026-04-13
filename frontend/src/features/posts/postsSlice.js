import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  acceptRequest,
  createPost as createPostRequest,
  deletePost as deletePostRequest,
  deletePostPhoto as deletePostPhotoRequest,
  fetchBrowseFeed as fetchBrowseFeedRequest,
  fetchOwnPosts as fetchOwnPostsRequest,
  fetchPostById,
  updatePost as updatePostRequest,
  updatePostStatus as updatePostStatusRequest,
  uploadPostPhoto as uploadPostPhotoRequest,
} from '../../services/api/postsApi.js'
import { buildApiErrorPayload } from '../../utils/readApiMessage.js'

const initialState = {
  publicItems: [],
  markers: [],
  ownItems: [],
  activePost: null,
  selectedPostId: null,
  filters: {
    category: '',
    keyword: '',
    postType: 'ALL',
    status: 'ALL',
    radiusKm: '',
    location: null,
  },
  browseStatus: 'idle',
  ownStatus: 'idle',
  detailStatus: 'idle',
  saveStatus: 'idle',
  photoStatus: 'idle',
  actionStatus: 'idle',
  error: null,
}

export const fetchBrowseFeed = createAsyncThunk(
  'posts/fetchBrowseFeed',
  async (filters, { rejectWithValue }) => {
    try {
      return await fetchBrowseFeedRequest(filters)
    } catch (error) {
      return rejectWithValue(buildApiErrorPayload(error, 'Posts could not be loaded'))
    }
  },
)

export const fetchOwnPosts = createAsyncThunk(
  'posts/fetchOwnPosts',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchOwnPostsRequest()
    } catch (error) {
      return rejectWithValue(buildApiErrorPayload(error, 'Your posts could not be loaded'))
    }
  },
)

export const fetchPostDetail = createAsyncThunk(
  'posts/fetchPostDetail',
  async (postId, { rejectWithValue }) => {
    try {
      return await fetchPostById(postId)
    } catch (error) {
      return rejectWithValue(buildApiErrorPayload(error, 'Post details could not be loaded'))
    }
  },
)

export const createPost = createAsyncThunk(
  'posts/createPost',
  async (values, { rejectWithValue }) => {
    try {
      return await createPostRequest(values)
    } catch (error) {
      return rejectWithValue(buildApiErrorPayload(error, 'Post could not be created'))
    }
  },
)

export const updatePost = createAsyncThunk(
  'posts/updatePost',
  async ({ postId, values }, { rejectWithValue }) => {
    try {
      return await updatePostRequest(postId, values)
    } catch (error) {
      return rejectWithValue(buildApiErrorPayload(error, 'Post could not be updated'))
    }
  },
)

export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (postId, { rejectWithValue }) => {
    try {
      await deletePostRequest(postId)
      return postId
    } catch (error) {
      return rejectWithValue(buildApiErrorPayload(error, 'Post could not be deleted'))
    }
  },
)

export const uploadPostPhoto = createAsyncThunk(
  'posts/uploadPostPhoto',
  async ({ postId, file }, { rejectWithValue }) => {
    try {
      return await uploadPostPhotoRequest(postId, file)
    } catch (error) {
      return rejectWithValue(buildApiErrorPayload(error, 'Post photo could not be uploaded'))
    }
  },
)

export const deletePostPhoto = createAsyncThunk(
  'posts/deletePostPhoto',
  async ({ postId, photoId }, { rejectWithValue }) => {
    try {
      await deletePostPhotoRequest(postId, photoId)
      return { postId, photoId }
    } catch (error) {
      return rejectWithValue(buildApiErrorPayload(error, 'Post photo could not be removed'))
    }
  },
)

export const acceptPostRequest = createAsyncThunk(
  'posts/acceptPostRequest',
  async (postId, { rejectWithValue }) => {
    try {
      return await acceptRequest(postId)
    } catch (error) {
      return rejectWithValue(buildApiErrorPayload(error, 'Request could not be accepted'))
    }
  },
)

export const changePostStatus = createAsyncThunk(
  'posts/changePostStatus',
  async ({ postId, status }, { rejectWithValue }) => {
    try {
      return await updatePostStatusRequest(postId, status)
    } catch (error) {
      return rejectWithValue(buildApiErrorPayload(error, 'Post status could not be updated'))
    }
  },
)

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    postFiltersChanged(state, action) {
      state.filters = { ...state.filters, ...action.payload }
    },
    selectedPostChanged(state, action) {
      state.selectedPostId = action.payload
    },
    clearPostsError(state) {
      state.error = null
    },
    clearActivePost(state) {
      state.activePost = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBrowseFeed.pending, (state) => {
        state.browseStatus = 'loading'
        state.error = null
      })
      .addCase(fetchBrowseFeed.fulfilled, (state, action) => {
        state.browseStatus = 'ready'
        state.publicItems = action.payload.posts
        state.markers = action.payload.markers

        if (state.selectedPostId && action.payload.posts.some((item) => item.id === state.selectedPostId)) {
          return
        }

        state.selectedPostId = action.payload.posts[0]?.id ?? null
      })
      .addCase(fetchBrowseFeed.rejected, (state, action) => {
        state.browseStatus = 'error'
        state.error = action.payload?.message ?? 'Posts could not be loaded'
      })
      .addCase(fetchOwnPosts.pending, (state) => {
        state.ownStatus = 'loading'
        state.error = null
      })
      .addCase(fetchOwnPosts.fulfilled, (state, action) => {
        state.ownStatus = 'ready'
        state.ownItems = action.payload
      })
      .addCase(fetchOwnPosts.rejected, (state, action) => {
        state.ownStatus = 'error'
        state.error = action.payload?.message ?? 'Your posts could not be loaded'
      })
      .addCase(fetchPostDetail.pending, (state) => {
        state.detailStatus = 'loading'
        state.error = null
      })
      .addCase(fetchPostDetail.fulfilled, (state, action) => {
        state.detailStatus = 'ready'
        state.activePost = action.payload
      })
      .addCase(fetchPostDetail.rejected, (state, action) => {
        state.detailStatus = 'error'
        state.error = action.payload?.message ?? 'Post details could not be loaded'
      })
      .addCase(createPost.pending, (state) => {
        state.saveStatus = 'loading'
        state.error = null
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.saveStatus = 'ready'
        state.activePost = action.payload
        state.ownItems = [toSummary(action.payload), ...state.ownItems]
      })
      .addCase(createPost.rejected, (state, action) => {
        state.saveStatus = 'error'
        state.error = action.payload?.message ?? 'Post could not be created'
      })
      .addCase(updatePost.pending, (state) => {
        state.saveStatus = 'loading'
        state.error = null
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        state.saveStatus = 'ready'
        state.activePost = action.payload
        replaceSummary(state.ownItems, action.payload)
        replaceSummary(state.publicItems, action.payload)
        replaceMarker(state.markers, action.payload)
      })
      .addCase(updatePost.rejected, (state, action) => {
        state.saveStatus = 'error'
        state.error = action.payload?.message ?? 'Post could not be updated'
      })
      .addCase(deletePost.pending, (state) => {
        state.actionStatus = 'loading'
        state.error = null
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.actionStatus = 'ready'
        state.ownItems = state.ownItems.filter((item) => item.id !== action.payload)
        state.publicItems = state.publicItems.filter((item) => item.id !== action.payload)
        state.markers = state.markers.filter((item) => item.id !== action.payload)

        if (state.activePost?.id === action.payload) {
          state.activePost = null
        }
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.actionStatus = 'error'
        state.error = action.payload?.message ?? 'Post could not be deleted'
      })
      .addCase(uploadPostPhoto.pending, (state) => {
        state.photoStatus = 'loading'
        state.error = null
      })
      .addCase(uploadPostPhoto.fulfilled, (state, action) => {
        state.photoStatus = 'ready'
        state.activePost = action.payload
      })
      .addCase(uploadPostPhoto.rejected, (state, action) => {
        state.photoStatus = 'error'
        state.error = action.payload?.message ?? 'Post photo could not be uploaded'
      })
      .addCase(deletePostPhoto.pending, (state) => {
        state.photoStatus = 'loading'
        state.error = null
      })
      .addCase(deletePostPhoto.fulfilled, (state, action) => {
        state.photoStatus = 'ready'

        if (state.activePost?.id === action.payload.postId) {
          state.activePost = {
            ...state.activePost,
            photos: state.activePost.photos.filter((photo) => photo.id !== action.payload.photoId),
          }
        }
      })
      .addCase(deletePostPhoto.rejected, (state, action) => {
        state.photoStatus = 'error'
        state.error = action.payload?.message ?? 'Post photo could not be removed'
      })
      .addCase(acceptPostRequest.pending, (state) => {
        state.actionStatus = 'loading'
        state.error = null
      })
      .addCase(acceptPostRequest.fulfilled, (state, action) => {
        state.actionStatus = 'ready'
        state.activePost = action.payload
        replaceSummary(state.publicItems, action.payload)
        replaceSummary(state.ownItems, action.payload)
        replaceMarker(state.markers, action.payload)
      })
      .addCase(acceptPostRequest.rejected, (state, action) => {
        state.actionStatus = 'error'
        state.error = action.payload?.message ?? 'Request could not be accepted'
      })
      .addCase(changePostStatus.pending, (state) => {
        state.actionStatus = 'loading'
        state.error = null
      })
      .addCase(changePostStatus.fulfilled, (state, action) => {
        state.actionStatus = 'ready'
        state.activePost = action.payload
        replaceSummary(state.publicItems, action.payload)
        replaceSummary(state.ownItems, action.payload)
        replaceMarker(state.markers, action.payload)
      })
      .addCase(changePostStatus.rejected, (state, action) => {
        state.actionStatus = 'error'
        state.error = action.payload?.message ?? 'Post status could not be updated'
      })
  },
})

function replaceSummary(items, post) {
  const nextSummary = toSummary(post)
  const index = items.findIndex((item) => item.id === post.id)

  if (index >= 0) {
    items[index] = nextSummary
  }
}

function replaceMarker(markers, post) {
  const index = markers.findIndex((item) => item.id === post.id)

  if (index >= 0) {
    markers[index] = {
      id: post.id,
      title: post.title,
      postType: post.postType,
      status: post.status,
      category: post.category,
      latitude: post.latitude,
      longitude: post.longitude,
    }
  }
}

function toSummary(post) {
  return {
    id: post.id,
    userId: post.userId,
    title: post.title,
    description: post.description,
    postType: post.postType,
    status: post.status,
    category: post.category,
    latitude: post.latitude,
    longitude: post.longitude,
    addressLabel: post.addressLabel,
    createdAt: post.createdAt,
  }
}

export const { clearActivePost, clearPostsError, postFiltersChanged, selectedPostChanged } =
  postsSlice.actions
export default postsSlice.reducer
