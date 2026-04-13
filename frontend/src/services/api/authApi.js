import {clearAccessToken, setAccessToken} from './authSession.js'
import {publicApi} from './client.js'

function persistSession(data) {
    const payload = {
        accessToken: data?.accessToken ?? null,
        user: data?.user ?? null,
    }

    setAccessToken(payload.accessToken)
    return payload
}

export async function register(values) {
    const {data} = await publicApi.post('/api/auth/register', values)
    return persistSession(data)
}

export async function login(values) {
    const {data} = await publicApi.post('/api/auth/login', values)
    return persistSession(data)
}

export async function restoreSession() {
    const {data} = await publicApi.post('/api/auth/refresh')
    return persistSession(data)
}

export async function logout() {
    try {
        await publicApi.post('/api/auth/logout')
    } finally {
        clearAccessToken()
    }
}