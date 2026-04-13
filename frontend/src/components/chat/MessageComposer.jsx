import styles from './MessageComposer.module.css'

function MessageComposer({ value, onChange, onSubmit, disabled, connectionStatus }) {
  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <textarea
        value={value}
        placeholder="Write a message..."
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
      <div className={styles.actions}>
        <p className={styles.status}>Realtime: {connectionStatus}</p>
        <button type="submit" disabled={disabled || !value.trim()}>
          Send message
        </button>
      </div>
    </form>
  )
}

export default MessageComposer

