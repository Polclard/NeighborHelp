import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { WS_BASE_URL } from '../../constants/env.js'
import { getAccessToken } from '../api/authSession.js'

let stompClient = null

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

export async function disconnectStompClient() {
  if (!stompClient) {
    return
  }

  await stompClient.deactivate()
  stompClient = null
}
