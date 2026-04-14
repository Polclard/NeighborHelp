import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ConversationList from '../components/chat/ConversationList.jsx'
import MessageComposer from '../components/chat/MessageComposer.jsx'
import MessageThread from '../components/chat/MessageThread.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import SurfaceCard from '../components/ui/SurfaceCard.jsx'
import {
  activeConversationChanged,
  createConversation,
  fetchConversationMessages,
} from '../features/chat/chatSlice.js'
import { useAppDispatch } from '../hooks/useAppDispatch.js'
import { useAppSelector } from '../hooks/useAppSelector.js'
import { waitForStompConnection } from '../services/websocket/stompClient.js'
import { useI18n } from '../i18n/useI18n.js'
import { readApiMessage } from '../utils/readApiMessage.js'
import styles from './ChatPage.module.css'

function ChatPage() {
  const dispatch = useAppDispatch()
  const { t } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const { currentUser } = useAppSelector((state) => state.auth)
  const {
    activeConversationId,
    connectionStatus,
    conversations,
    conversationsStatus,
    error,
    messagesByConversation,
    messagesStatusByConversation,
  } = useAppSelector((state) => state.chat)
  const [messageText, setMessageText] = useState('')
  const [composerError, setComposerError] = useState('')
  const bootstrappedConversationRef = useRef(null)

  useEffect(() => {
    if (!currentUser?.id) {
      return
    }

    const recipientUserId = searchParams.get('userId')
    const postId = searchParams.get('postId')
    const bootstrapKey = `${recipientUserId || ''}:${postId || ''}`

    if (!recipientUserId || bootstrappedConversationRef.current === bootstrapKey) {
      return
    }

    bootstrappedConversationRef.current = bootstrapKey

    if (recipientUserId === currentUser.id) {
      setSearchParams({}, { replace: true })
      return
    }

    dispatch(
      createConversation({
        recipientUserId,
        postId: postId || null,
      }),
    )
      .unwrap()
      .then((conversation) => {
        dispatch(activeConversationChanged(conversation.id))
        setSearchParams({}, { replace: true })
      })
      .catch(() => {})
  }, [currentUser?.id, dispatch, searchParams, setSearchParams])

  useEffect(() => {
    if (activeConversationId) {
      dispatch(fetchConversationMessages({ conversationId: activeConversationId }))
    }
  }, [activeConversationId, dispatch])

  useEffect(() => {
    if (!activeConversationId && conversations.length) {
      dispatch(activeConversationChanged(conversations[0].id))
    }
  }, [activeConversationId, conversations, dispatch])

  useEffect(() => {
    return () => {
      dispatch(activeConversationChanged(null))
    }
  }, [dispatch])

  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId) ?? null
  const messages = activeConversationId ? messagesByConversation[activeConversationId] ?? [] : []

  return (
    <div className={styles.page}>
      <SurfaceCard
        eyebrow={t('chat.eyebrow')}
        title={t('chat.title')}
      >
        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.layout}>
          <div className={styles.column}>
            <SurfaceCard title={t('chat.conversationsTitle')} description={t('chat.conversationsDescription')}>
              {conversationsStatus === 'loading' ? (
                <p className={styles.copy}>{t('chat.loadingConversations')}</p>
              ) : (
                <ConversationList
                  activeConversationId={activeConversationId}
                  conversations={conversations}
                  onSelect={(conversationId) => dispatch(activeConversationChanged(conversationId))}
                />
              )}
            </SurfaceCard>
          </div>

          <div className={styles.column}>
            <SurfaceCard
              title={activeConversation ? activeConversation.postTitle || t('chat.directConversation') : t('chat.selectConversation')}
              description={activeConversation ? `${activeConversation.otherUserFirstName} ${activeConversation.otherUserLastName}` : t('chat.selectConversationDescription')}
            >
              {activeConversation ? (
                <>
                  {messagesStatusByConversation[activeConversation.id] === 'loading' ? (
                    <p className={styles.copy}>{t('chat.loadingMessages')}</p>
                  ) : (
                    <MessageThread currentUserId={currentUser?.id} messages={messages} />
                  )}

                  <MessageComposer
                    connectionStatus={connectionStatus}
                    disabled={!activeConversation || connectionStatus !== 'connected'}
                    onChange={setMessageText}
                    onSubmit={async (event) => {
                      event.preventDefault()
                      setComposerError('')

                      if (!messageText.trim()) {
                        return
                      }

                      try {
                        const client = await waitForStompConnection()

                        client.publish({
                          destination: '/app/chat.send',
                          body: JSON.stringify({
                            conversationId: activeConversation.id,
                            content: messageText.trim(),
                          }),
                        })
                        setMessageText('')
                      } catch (error) {
                        setComposerError(
                          readApiMessage(
                            error,
                            t('chat.connectionNotReady'),
                          ),
                        )
                      }
                    }}
                    value={messageText}
                  />

                  {composerError ? <p className={styles.error}>{composerError}</p> : null}
                </>
              ) : (
                <EmptyState
                  title={t('chat.emptyActiveTitle')}
                  description={t('chat.emptyActiveDescription')}
                />
              )}
            </SurfaceCard>
          </div>
        </div>
      </SurfaceCard>
    </div>
  )
}

export default ChatPage
