import { combineReducers } from '@reduxjs/toolkit'
import adminReducer from '../features/admin/adminSlice.js'
import authReducer from '../features/auth/authSlice.js'
import chatReducer from '../features/chat/chatSlice.js'
import mapReducer from '../features/map/mapSlice.js'
import postsReducer from '../features/posts/postsSlice.js'
import profileReducer from '../features/profile/profileSlice.js'

export const rootReducer = combineReducers({
  admin: adminReducer,
  auth: authReducer,
  chat: chatReducer,
  map: mapReducer,
  posts: postsReducer,
  profile: profileReducer,
})
