import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ConversationList from '../components/chat/ConversationList.jsx'
import MessageComposer from '../components/chat/MessageComposer.jsx'
import MessageThread from '../components/chat/MessageThread.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import PaginationControls from '../components/ui/PaginationControls.jsx'
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

const CHAT_PAGE_SIZE = 3

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
  const [messageImageUrl, setMessageImageUrl] = useState('')
  const [composerError, setComposerError] = useState('')
  const [conversationPage, setConversationPage] = useState(1)
  const [participantFilter, setParticipantFilter] = useState('')
  const [titleFilter, setTitleFilter] = useState('')
  const bootstrappedConversationRef = useRef(null)

  const normalizedParticipantFilter = participantFilter.trim().toLowerCase()
  const normalizedTitleFilter = titleFilter.trim().toLowerCase()
  const filteredConversations = conversations.filter((conversation) =>
    matchesConversationFilters(conversation, normalizedParticipantFilter, normalizedTitleFilter),
  )
  const conversationTotalPages = getTotalPages(filteredConversations.length, CHAT_PAGE_SIZE)
  const safeConversationPage = clampPage(conversationPage, conversationTotalPages)
  const paginatedConversations = paginateRows(filteredConversations, safeConversationPage, CHAT_PAGE_SIZE)
  const firstFilteredConversationId = filteredConversations[0]?.id ?? null
  const hasActiveConversationInFilteredResults = filteredConversations.some(
    (conversation) => conversation.id === activeConversationId,
  )

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
    if (!firstFilteredConversationId) {
      if (activeConversationId) {
        dispatch(activeConversationChanged(null))
      }
      return
    }

    if (!hasActiveConversationInFilteredResults) {
      dispatch(activeConversationChanged(firstFilteredConversationId))
    }
  }, [
    activeConversationId,
    dispatch,
    firstFilteredConversationId,
    hasActiveConversationInFilteredResults,
  ])

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
              <div className={styles.toolbar}>
                <label className={styles.filterField}>
                  <span>{t('chat.filters.username')}</span>
                  <input
                    type="search"
                    value={participantFilter}
                    placeholder={t('chat.filters.usernamePlaceholder')}
                    onChange={(event) => {
                      setParticipantFilter(event.target.value)
                      setConversationPage(1)
                    }}
                  />
                </label>

                <label className={styles.filterField}>
                  <span>{t('chat.filters.title')}</span>
                  <input
                    type="search"
                    value={titleFilter}
                    placeholder={t('chat.filters.titlePlaceholder')}
                    onChange={(event) => {
                      setTitleFilter(event.target.value)
                      setConversationPage(1)
                    }}
                  />
                </label>
              </div>

              {conversationsStatus === 'loading' ? (
                <p className={styles.copy}>{t('chat.loadingConversations')}</p>
              ) : (
                <>
                  <ConversationList
                    activeConversationId={activeConversationId}
                    conversations={paginatedConversations}
                    emptyTitle={
                      conversations.length ? t('chat.emptyFilteredTitle') : t('chat.emptyListTitle')
                    }
                    emptyDescription={
                      conversations.length ? t('chat.emptyFilteredDescription') : t('chat.emptyListDescription')
                    }
                    onSelect={(conversationId) => dispatch(activeConversationChanged(conversationId))}
                  />

                  <PaginationControls
                    page={safeConversationPage}
                    totalPages={conversationTotalPages}
                    onPageChange={setConversationPage}
                    previousLabel={t('common.actions.previous')}
                    nextLabel={t('common.actions.next')}
                    summary={buildPaginationSummary(safeConversationPage, CHAT_PAGE_SIZE, filteredConversations.length, t)}
                  />
                </>
              )}
            </SurfaceCard>
          </div>

          <div className={styles.column}>
            <SurfaceCard
              className={styles.threadCard}
              title={activeConversation ? activeConversation.postTitle || t('chat.directConversation') : t('chat.selectConversation')}
              description={activeConversation ? `${activeConversation.otherUserFirstName} ${activeConversation.otherUserLastName}` : t('chat.selectConversationDescription')}
            >
              {activeConversation ? (
                <div className={styles.threadPanel}>
                  <div className={styles.threadViewport}>
                    {messagesStatusByConversation[activeConversation.id] === 'loading' ? (
                      <p className={styles.copy}>{t('chat.loadingMessages')}</p>
                    ) : (
                      <MessageThread currentUserId={currentUser?.id} messages={messages} />
                    )}
                  </div>

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
                        const normalizedContent = normalizeNullable(messageText)
                        const normalizedImageUrl = normalizeNullable(messageImageUrl)

                        if (!normalizedContent && !normalizedImageUrl) {
                          return
                        }

                        const client = await waitForStompConnection()

                        client.publish({
                          destination: '/app/chat.send',
                          body: JSON.stringify({
                            conversationId: activeConversation.id,
                            content: normalizedContent,
                            imageUrl: normalizedImageUrl,
                          }),
                        })
                        setMessageText('')
                        setMessageImageUrl('')
                      } catch (error) {
                        setComposerError(
                          readApiMessage(
                            error,
                            t('chat.connectionNotReady'),
                          ),
                        )
                      }
                    }}
                    imageUrl={messageImageUrl}
                    onImageUrlChange={setMessageImageUrl}
                    value={messageText}
                  />

                  {composerError ? <p className={styles.error}>{composerError}</p> : null}
                </div>
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

function normalizeNullable(value) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function matchesConversationFilters(conversation, participantFilter, titleFilter) {
  const participantName = `${conversation.otherUserFirstName ?? ''} ${conversation.otherUserLastName ?? ''}`
    .trim()
    .toLowerCase()
  const postTitle = (conversation.postTitle ?? '').toLowerCase()

  return participantName.includes(participantFilter) && postTitle.includes(titleFilter)
}

function paginateRows(rows, page, pageSize) {
  const start = (page - 1) * pageSize
  return rows.slice(start, start + pageSize)
}

function getTotalPages(count, pageSize) {
  return Math.max(1, Math.ceil(count / pageSize))
}

function clampPage(page, totalPages) {
  return Math.max(1, Math.min(page, totalPages))
}

function buildPaginationSummary(page, pageSize, total, t) {
  if (!total) {
    return t('chat.pagination.empty')
  }

  const start = (page - 1) * pageSize + 1
  const end = Math.min(total, start + pageSize - 1)

  return t('chat.pagination.summary', { start, end, total })
}

export default ChatPage
