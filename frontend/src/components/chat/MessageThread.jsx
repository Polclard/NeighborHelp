import { useEffect, useRef } from 'react'
import { useI18n } from '../../i18n/useI18n.js'
import { formatDateTime } from '../../utils/formatDateTime.js'
import EmptyState from '../ui/EmptyState.jsx'
import styles from './MessageThread.module.css'

function MessageThread({ messages, currentUserId }) {
  const { t } = useI18n()
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!messages.length) {
    return (
      <EmptyState
        title={t('chat.emptyThreadTitle')}
        description={t('chat.emptyThreadDescription')}
      />
    )
  }

  return (
    <div className={styles.thread}>
      {messages.map((message) => {
        const isOwnMessage = message.senderId === currentUserId

        return (
          <article
            key={message.id}
            className={isOwnMessage ? `${styles.message} ${styles.own}` : styles.message}
          >
            <p>{message.content || t('common.imageAttachment')}</p>
            <span>{formatDateTime(message.sentAt)}</span>
          </article>
        )
      })}
      <div ref={endRef} />
    </div>
  )
}

export default MessageThread
