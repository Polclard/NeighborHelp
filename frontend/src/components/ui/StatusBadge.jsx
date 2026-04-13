import { formatEnumLabel, getPostTone } from '../../constants/posts.js'
import styles from './StatusBadge.module.css'

function StatusBadge({ value, label = null, tone = null }) {
  const resolvedTone = tone ?? getPostTone(value)

  return <span className={`${styles.badge} ${styles[resolvedTone]}`}>{label ?? formatEnumLabel(value)}</span>
}

export default StatusBadge

