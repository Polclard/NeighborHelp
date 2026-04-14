import { useI18n } from '../../i18n/useI18n.js'
import styles from './MessageComposer.module.css'

function MessageComposer({ value, onChange, onSubmit, disabled, connectionStatus }) {
  const { t } = useI18n()
  const statusLabel = t(`chat.connection.${connectionStatus}`)

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <textarea
        value={value}
        placeholder={t('chat.writeMessage')}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
      <div className={styles.actions}>
        <p className={styles.status}>{t('chat.realtime', { status: statusLabel })}</p>
        <button type="submit" disabled={disabled || !value.trim()}>
          {t('chat.sendMessage')}
        </button>
      </div>
    </form>
  )
}

export default MessageComposer
