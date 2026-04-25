import { useState } from 'react'
import { useI18n } from '../../i18n/useI18n.js'
import { buildUploadUrl } from '../../utils/buildUploadUrl.js'
import styles from './MessageComposer.module.css'

const QUICK_EMOJIS = ['🙂', '😊', '👍', '🙏', '🎉', '❤️', '😂', '🔥']

function MessageComposer({
  value,
  imageUrl,
  onChange,
  onImageUrlChange,
  onSubmit,
  disabled,
  connectionStatus,
}) {
  const { t } = useI18n()
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const statusLabel = t(`chat.connection.${connectionStatus}`)
  const canSend = Boolean(value.trim() || imageUrl.trim())
  const previewUrl = imageUrl.trim() ? buildUploadUrl(imageUrl) : null

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.toolbar}>
        <button
          className={styles.secondaryButton}
          type="button"
          onClick={() => setEmojiPickerOpen((current) => !current)}
          disabled={disabled}
        >
          {t('chat.toggleEmojiPicker')}
        </button>
        <p className={styles.hint}>{t('chat.enterToSend')}</p>
      </div>

      {emojiPickerOpen ? (
        <div className={styles.emojiPicker} aria-label={t('chat.toggleEmojiPicker')}>
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              className={styles.emojiButton}
              type="button"
              disabled={disabled}
              onClick={() => onChange(`${value}${emoji}`)}
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : null}

      <textarea
        value={value}
        placeholder={t('chat.writeMessage')}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()

            if (!disabled && canSend) {
              event.currentTarget.form?.requestSubmit()
            }
          }
        }}
      />

      <input
        className={styles.imageUrlInput}
        type="text"
        value={imageUrl}
        placeholder={t('chat.imageUrlPlaceholder')}
        onChange={(event) => onImageUrlChange(event.target.value)}
        disabled={disabled}
      />

      {previewUrl ? (
        <div className={styles.previewCard}>
          <img className={styles.previewImage} src={previewUrl} alt={t('common.imageAttachment')} />
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={disabled}
            onClick={() => onImageUrlChange('')}
          >
            {t('chat.clearImage')}
          </button>
        </div>
      ) : null}

      <div className={styles.actions}>
        <p className={styles.status}>{t('chat.realtime', { status: statusLabel })}</p>
        <button type="submit" disabled={disabled || !canSend}>
          {t('chat.sendMessage')}
        </button>
      </div>
    </form>
  )
}

export default MessageComposer
