import styles from './DonutChart.module.css'

function DonutChart({ items, size = 156, strokeWidth = 18, centerLabel = '', centerCaption = '' }) {
  const sanitizedItems = items.filter((item) => item.value > 0)
  const total = sanitizedItems.reduce((sum, item) => sum + item.value, 0)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className={styles.chart}>
      <div className={styles.visual}>
        <svg viewBox={`0 0 ${size} ${size}`} className={styles.svg} role="img" aria-label={centerCaption || centerLabel}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(16, 37, 31, 0.08)"
            strokeWidth={strokeWidth}
          />
          {total
            ? sanitizedItems.map((item) => {
                const segmentLength = (item.value / total) * circumference
                const segment = (
                  <circle
                    key={item.label}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={item.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                    strokeDashoffset={-offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                  />
                )
                offset += segmentLength
                return segment
              })
            : null}
        </svg>

        <div className={styles.center}>
          <strong>{centerLabel}</strong>
          {centerCaption ? <span>{centerCaption}</span> : null}
        </div>
      </div>

      <div className={styles.legend}>
        {items.map((item) => (
          <div key={item.label} className={styles.legendRow}>
            <span className={styles.swatch} style={{ background: item.color }} />
            <span className={styles.legendLabel}>{item.label}</span>
            <strong className={styles.legendValue}>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DonutChart
