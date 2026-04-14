import styles from './BarChart.module.css'

function BarChart({ items }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1)

  return (
    <div className={styles.chart}>
      {items.map((item) => {
        const width = `${(item.value / maxValue) * 100}%`

        return (
          <div key={item.label} className={styles.row}>
            <div className={styles.copy}>
              <span className={styles.label}>{item.label}</span>
              <strong className={styles.value}>{item.value}</strong>
            </div>
            <div className={styles.track}>
              <div className={styles.fill} style={{ width, background: item.color }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default BarChart
