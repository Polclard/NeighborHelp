import { formatEnumLabel, getPostTone } from '../../constants/posts.js'
import { useI18n } from '../../i18n/useI18n.js'
import styles from './StatusBadge.module.css'

function StatusBadge({ value, label = null, tone = null }) {
  const { t } = useI18n()
  const resolvedTone = tone ?? getPostTone(value)

  return <span className={`${styles.badge} ${styles[resolvedTone]}`}>{label ?? formatEnumLabel(value, t)}</span>
}

export default StatusBadge
