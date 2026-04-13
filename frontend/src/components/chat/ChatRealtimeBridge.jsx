import { useEffect, useRef } from 'react'
import {
  chatConnectionStatusChanged,
  fetchConversations,
  messageReceived,
} from '../../features/chat/chatSlice.js'
import { useAppDispatch } from '../../hooks/useAppDispatch.js'
import { useAppSelector } from '../../hooks/useAppSelector.js'
import { createStompClient } from '../../services/websocket/stompClient.js'

function ChatRealtimeBridge() {
  const dispatch = useAppDispatch()
  const { currentUser } = useAppSelector((state) => state.auth)
  const conversations = useAppSelector((state) => state.chat.conversations)
  const conversationIdsRef = useRef(new Set())

  useEffect(() => {
    conversationIdsRef.current = new Set(conversations.map((conversation) => conversation.id))
  }, [conversations])

  useEffect(() => {
    if (!currentUser?.id) {
      return
    }

    dispatch(fetchConversations())
  }, [currentUser?.id, dispatch])

  useEffect(() => {
    if (!currentUser?.id) {
      return
    }

    const client = createStompClient()
    let subscription = null
    let cancelled = false

    const handleIncomingMessage = async (frame) => {
      const message = JSON.parse(frame.body)

      if (!conversationIdsRef.current.has(message.conversationId)) {
        try {
          await dispatch(fetchConversations()).unwrap()
        } catch {
          // The chat slice already stores the request error.
        }
      }

      if (!cancelled) {
        dispatch(messageReceived({ message, viewerId: currentUser.id }))
      }
    }

    const subscribeToMessages = () => {
      if (cancelled || subscription) {
        return
      }

      subscription = client.subscribe('/user/queue/messages', handleIncomingMessage)
    }

    client.onConnect = () => {
      dispatch(chatConnectionStatusChanged('connected'))
      subscribeToMessages()
    }

    client.onStompError = () => {
      dispatch(chatConnectionStatusChanged('error'))
    }

    client.onWebSocketClose = () => {
      dispatch(chatConnectionStatusChanged('disconnected'))
    }

    if (client.connected) {
      dispatch(chatConnectionStatusChanged('connected'))
      subscribeToMessages()
    } else if (!client.active) {
      dispatch(chatConnectionStatusChanged('connecting'))
      client.activate()
    }

    return () => {
      cancelled = true
      subscription?.unsubscribe()
      dispatch(chatConnectionStatusChanged('idle'))
    }
  }, [currentUser?.id, dispatch])

  return null
}

export default ChatRealtimeBridge
