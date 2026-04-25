import { useEffect, useRef } from 'react'
import { useI18n } from '../../i18n/useI18n.js'
import { buildUploadUrl } from '../../utils/buildUploadUrl.js'
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
        const imageUrl = buildUploadUrl(message.imageUrl)

        return (
          <article
            key={message.id}
            className={isOwnMessage ? `${styles.message} ${styles.own}` : styles.message}
          >
            {imageUrl ? (
              <a className={styles.imageLink} href={imageUrl} target="_blank" rel="noreferrer">
                <img className={styles.image} src={imageUrl} alt={t('common.imageAttachment')} />
              </a>
            ) : null}
            {message.content ? <p>{message.content}</p> : null}
            {!message.content && !imageUrl ? <p>{t('common.imageAttachment')}</p> : null}
            <span>{formatDateTime(message.sentAt)}</span>
          </article>
        )
      })}
      <div ref={endRef} />
    </div>
  )
}

export default MessageThread
