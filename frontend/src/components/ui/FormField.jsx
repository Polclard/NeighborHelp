import styles from './FormField.module.css'

function FormField({ label, error = '', help = '', children }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {children}
      <span className={error ? styles.error : styles.help}>{error || help || '\u00A0'}</span>
    </label>
  )
}

export default FormField

