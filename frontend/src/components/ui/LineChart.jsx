import styles from './LineChart.module.css'

function LineChart({ points }) {
  const width = 320
  const height = 160
  const padding = 16
  const maxValue = Math.max(...points.map((point) => point.value), 1)
  const innerWidth = width - padding * 2
  const innerHeight = height - padding * 2

  const coordinates = points.map((point, index) => {
    const x = padding + (points.length === 1 ? innerWidth / 2 : (index / (points.length - 1)) * innerWidth)
    const y = padding + innerHeight - (point.value / maxValue) * innerHeight
    return { ...point, x, y }
  })

  const polyline = coordinates.map((point) => `${point.x},${point.y}`).join(' ')

  return (
    <div className={styles.chart}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.svg} role="img" aria-label="trend chart">
        {[0.25, 0.5, 0.75, 1].map((tick) => (
          <line
            key={tick}
            x1={padding}
            x2={width - padding}
            y1={padding + innerHeight - innerHeight * tick}
            y2={padding + innerHeight - innerHeight * tick}
            className={styles.grid}
          />
        ))}
        <polyline points={polyline} className={styles.line} />
        {coordinates.map((point) => (
          <circle key={point.label} cx={point.x} cy={point.y} r="4.5" className={styles.dot} />
        ))}
      </svg>

      <div className={styles.labels}>
        {coordinates.map((point) => (
          <div key={point.label} className={styles.labelCell}>
            <span>{point.label}</span>
            <strong>{point.value}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LineChart
