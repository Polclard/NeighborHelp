import styles from './EmptyState.module.css'

function EmptyState({ title, description, action = null }) {
  return (
    <div className={styles.state}>
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  )
}

export default EmptyState

