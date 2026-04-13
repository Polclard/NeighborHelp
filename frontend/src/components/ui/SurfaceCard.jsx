import styles from './SurfaceCard.module.css'

function SurfaceCard({
  eyebrow = null,
  title = null,
  description = null,
  actions = null,
  className = '',
  children,
}) {
  return (
    <section className={className ? `${styles.card} ${className}` : styles.card}>
      {(eyebrow || title || description || actions) && (
        <header className={styles.header}>
          <div className={styles.copy}>
            {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
            {title ? <h2 className={styles.title}>{title}</h2> : null}
            {description ? <p className={styles.description}>{description}</p> : null}
          </div>
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </header>
      )}

      <div className={styles.body}>{children}</div>
    </section>
  )
}

export default SurfaceCard

