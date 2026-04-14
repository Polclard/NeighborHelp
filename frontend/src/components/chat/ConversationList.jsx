import { formatDateTime } from '../../utils/formatDateTime.js'
import { useI18n } from '../../i18n/useI18n.js'
import AvatarBadge from '../ui/AvatarBadge.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import StatusBadge from '../ui/StatusBadge.jsx'
import styles from './ConversationList.module.css'

function ConversationList({ conversations, activeConversationId, onSelect }) {
  const { t } = useI18n()

  if (!conversations.length) {
    return (
      <EmptyState
        title={t('chat.emptyListTitle')}
        description={t('chat.emptyListDescription')}
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

            <p className={styles.title}>{conversation.postTitle || t('chat.directConversation')}</p>

            <div className={styles.meta}>
              {conversation.postType ? <StatusBadge value={conversation.postType} /> : null}
              {conversation.postStatus ? <StatusBadge value={conversation.postStatus} /> : null}
            </div>

            <p className={styles.preview}>
              {conversation.lastMessagePreview === 'Image'
                ? t('common.imageAttachment')
                : conversation.lastMessagePreview || t('chat.noMessagesYet')}
            </p>
          </button>
        )
      })}
    </div>
  )
}

export default ConversationList
