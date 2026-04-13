import { formatDateTime } from '../../utils/formatDateTime.js'
import AvatarBadge from '../ui/AvatarBadge.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import StatusBadge from '../ui/StatusBadge.jsx'
import styles from './ConversationList.module.css'

function ConversationList({ conversations, activeConversationId, onSelect }) {
  if (!conversations.length) {
    return (
      <EmptyState
        title="No conversations yet"
        description="Start from a post detail page or a public profile to open a new thread."
      />
    )
  }

  return (
    <div className={styles.list}>
      {conversations.map((conversation) => {
        const fullName = `${conversation.otherUserFirstName} ${conversation.otherUserLastName}`

        return (
          <button
            key={conversation.id}
            type="button"
            className={
              conversation.id === activeConversationId
                ? `${styles.item} ${styles.active}`
                : styles.item
            }
            onClick={() => onSelect(conversation.id)}
          >
            <div className={styles.head}>
              <AvatarBadge src={conversation.otherUserProfilePicture} name={fullName} size="small" />
              <div className={styles.copy}>
                <strong>{fullName}</strong>
                <span>{formatDateTime(conversation.lastMessageAt ?? conversation.createdAt)}</span>
              </div>
              {conversation.unreadCount ? <span className={styles.unread}>{conversation.unreadCount}</span> : null}
            </div>

            <p className={styles.title}>{conversation.postTitle || 'Direct conversation'}</p>

            <div className={styles.meta}>
              {conversation.postType ? <StatusBadge value={conversation.postType} /> : null}
              {conversation.postStatus ? <StatusBadge value={conversation.postStatus} /> : null}
            </div>

            <p className={styles.preview}>{conversation.lastMessagePreview || 'No messages yet'}</p>
          </button>
        )
      })}
    </div>
  )
}

export default ConversationList

