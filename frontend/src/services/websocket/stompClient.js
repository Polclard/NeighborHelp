import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { WS_BASE_URL } from '../../constants/env.js'
import { getAccessToken } from '../api/authSession.js'

let stompClient = null
const CONNECT_TIMEOUT_MS = 5000

function buildConnectHeaders() {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function createStompClient() {
  if (stompClient) {
    return stompClient
  }

  stompClient = new Client({
    reconnectDelay: 5000,
    webSocketFactory: () => new SockJS(`${WS_BASE_URL}/ws`),
    connectHeaders: buildConnectHeaders(),
    beforeConnect() {
      stompClient.connectHeaders = buildConnectHeaders()
    },
  })

  return stompClient
}

export async function waitForStompConnection(timeoutMs = CONNECT_TIMEOUT_MS) {
  const client = createStompClient()

  if (client.connected) {
    return client
  }

  if (!client.active) {
    client.activate()
  }

  const deadline = Date.now() + timeoutMs

  while (!client.connected) {
    if (Date.now() >= deadline) {
      throw new Error('Timed out waiting for realtime connection')
    }

    await new Promise((resolve) => {
      window.setTimeout(resolve, 100)
    })
  }

  return client
}

export async function disconnectStompClient() {
  if (!stompClient) {
    return
  }

  await stompClient.deactivate()
  stompClient = null
}
