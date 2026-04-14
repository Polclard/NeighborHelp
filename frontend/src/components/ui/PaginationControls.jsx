import styles from './PaginationControls.module.css'

function PaginationControls({ page, totalPages, onPageChange, previousLabel, nextLabel, summary }) {
  if (totalPages <= 1) {
    return null
  }

  const pages = buildVisiblePages(page, totalPages)

  return (
    <div className={styles.pagination}>
      {summary ? <p className={styles.summary}>{summary}</p> : <span />}

      <div className={styles.controls}>
        <button type="button" className={styles.button} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          {previousLabel}
        </button>

        <div className={styles.pages}>
          {pages.map((item, index) =>
            item === 'ellipsis' ? (
              <span key={`${item}-${index}`} className={styles.ellipsis}>
                ...
              </span>
            ) : (
              <button
                key={item}
                type="button"
                className={item === page ? `${styles.pageButton} ${styles.pageButtonActive}` : styles.pageButton}
                onClick={() => onPageChange(item)}
              >
                {item}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          className={styles.button}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          {nextLabel}
        </button>
      </div>
    </div>
  )
}

function buildVisiblePages(page, totalPages) {
  const pages = []

  for (let value = 1; value <= totalPages; value += 1) {
    const isEdge = value === 1 || value === totalPages
    const isNearCurrent = Math.abs(value - page) <= 1

    if (isEdge || isNearCurrent) {
      pages.push(value)
      continue
    }

    const previous = pages[pages.length - 1]
    if (previous !== 'ellipsis') {
      pages.push('ellipsis')
    }
  }

  return pages
}

export default PaginationControls
