import styles from './FeaturePlaceholderPage.module.css'

function FeaturePlaceholderPage({ eyebrow, title, description, checkpoints }) {
  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2>{title}</h2>
        <p className={styles.description}>{description}</p>
      </div>

      <div className={styles.grid}>
        {checkpoints.map((checkpoint, index) => (
          <article key={checkpoint} className={styles.card}>
            <span className={styles.step}>0{index + 1}</span>
            <p>{checkpoint}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default FeaturePlaceholderPage
