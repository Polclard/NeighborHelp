import axios from 'axios'
import {API_BASE_URL} from '../../constants/env.js'
import {clearAccessToken, getAccessToken, setAccessToken} from './authSession.js'

export const publicApi = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
})

const refreshApi = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
})

let refreshPromise = null

export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
})

api.interceptors.request.use((config) => {
    const token = getAccessToken()

    if (token) {
        config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
        }
    }

    return config
})

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const {config, response} = error

        if (
            !response ||
            response.status !== 401 ||
            config?._retry ||
            config?.url?.startsWith('/api/auth/')
        ) {
            throw error
        }

        config._retry = true

        try {
            if (!refreshPromise) {
                refreshPromise = refreshApi
                    .post('/api/auth/refresh')
                    .then(({data}) => {
                        const nextToken = data?.accessToken ?? null
                        setAccessToken(nextToken)
                        return nextToken
                    })
                    .finally(() => {
                        refreshPromise = null
                    })
            }

            const nextToken = await refreshPromise

            if (!nextToken) {
                clearAccessToken()
                throw error
            }

            config.headers = {
                ...config.headers,
                Authorization: `Bearer ${nextToken}`,
            }

            return api.request(config)
        } catch (refreshError) {
            clearAccessToken()
            throw refreshError
        }
    },
)