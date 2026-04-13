import { useEffect, useRef } from 'react'
import { formatDateTime } from '../../utils/formatDateTime.js'
import EmptyState from '../ui/EmptyState.jsx'
import styles from './MessageThread.module.css'

function MessageThread({ messages, currentUserId }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!messages.length) {
    return (
      <EmptyState
        title="No messages in this thread"
        description="Say hello, confirm the details, and move the service request forward."
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
            <p>{message.content || 'Image attachment'}</p>
            <span>{formatDateTime(message.sentAt)}</span>
          </article>
        )
      })}
      <div ref={endRef} />
    </div>
  )
}

export default MessageThread

