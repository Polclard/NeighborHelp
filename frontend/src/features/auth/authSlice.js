import {createAsyncThunk, createSlice} from '@reduxjs/toolkit'
import {
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  restoreSession as restoreSessionRequest,
} from '../../services/api/authApi.js'
import {disconnectStompClient} from '../../services/websocket/stompClient.js'

const initialState = {
    accessToken: null,
    currentUser: null,
    status: 'anonymous',
    bootstrapStatus: 'idle',
    error: null,
}

function readApiMessage(error, fallback) {
    return error?.response?.data?.message ?? fallback
}

function applySession(state, payload) {
    state.accessToken = payload.accessToken
    state.currentUser = payload.user
    state.status = payload.user ? 'authenticated' : 'anonymous'
    state.error = null
}

export const restoreSession = createAsyncThunk(
    'auth/restoreSession',
    async (_, {rejectWithValue}) => {
        try {
            return await restoreSessionRequest()
        } catch (error) {
            return rejectWithValue(readApiMessage(error, 'Session could not be restored'))
        }
    },
)

export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async (values, {rejectWithValue}) => {
        try {
            return await loginRequest(values)
        } catch (error) {
            return rejectWithValue(readApiMessage(error, 'Login failed'))
        }
    },
)

export const registerUser = createAsyncThunk(
    'auth/registerUser',
    async (values, {rejectWithValue}) => {
        try {
            return await registerRequest(values)
        } catch (error) {
            return rejectWithValue(readApiMessage(error, 'Registration failed'))
        }
    },
)

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
    await disconnectStompClient()
    await logoutRequest()
})

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearAuthError(state) {
            state.error = null
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(restoreSession.pending, (state) => {
                state.bootstrapStatus = 'loading'
            })
            .addCase(restoreSession.fulfilled, (state, action) => {
                applySession(state, action.payload)
                state.bootstrapStatus = 'ready'
            })
            .addCase(restoreSession.rejected, (state) => {
                state.accessToken = null
                state.currentUser = null
                state.status = 'anonymous'
                state.bootstrapStatus = 'ready'
                state.error = null
            })
            .addCase(loginUser.pending, (state) => {
                state.status = 'loading'
                state.error = null
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                applySession(state, action.payload)
                state.bootstrapStatus = 'ready'
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.status = 'anonymous'
                state.error = action.payload ?? 'Login failed'
            })
            .addCase(registerUser.pending, (state) => {
                state.status = 'loading'
                state.error = null
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                applySession(state, action.payload)
                state.bootstrapStatus = 'ready'
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.status = 'anonymous'
                state.error = action.payload ?? 'Registration failed'
            })
            .addCase(logoutUser.pending, (state) => {
                state.status = 'loading'
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.accessToken = null
                state.currentUser = null
                state.status = 'anonymous'
                state.bootstrapStatus = 'ready'
                state.error = null
            })
            .addCase(logoutUser.rejected, (state) => {
                state.accessToken = null
                state.currentUser = null
                state.status = 'anonymous'
                state.bootstrapStatus = 'ready'
                state.error = null
            })
    },
})

export const {clearAuthError} = authSlice.actions
export default authSlice.reducer