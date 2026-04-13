import styles from './MetricCard.module.css'

function MetricCard({ label, value, caption }) {
  return (
    <article className={styles.card}>
      <p className={styles.label}>{label}</p>
      <strong className={styles.value}>{value}</strong>
      <p className={styles.caption}>{caption}</p>
    </article>
  )
}

export default MetricCard

