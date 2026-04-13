import EmptyState from './EmptyState.jsx'
import styles from './DataTable.module.css'

function DataTable({ columns, rows, rowKey, emptyTitle = 'No rows yet', emptyDescription = 'Nothing to show.' }) {
  if (!rows.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={typeof rowKey === 'function' ? rowKey(row) : row[rowKey]}>
              {columns.map((column) => (
                <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable

