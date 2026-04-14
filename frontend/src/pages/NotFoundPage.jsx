import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n.js'
import styles from './NotFoundPage.module.css'

function NotFoundPage() {
  const { t } = useI18n()

  return (
    <section className={styles.page}>
      <p className={styles.code}>404</p>
      <h1>{t('notFound.title')}</h1>
      <p>
        {t('notFound.description')}
      </p>
      <Link className={styles.link} to="/">
        {t('notFound.return')}
      </Link>
    </section>
  )
}

export default NotFoundPage
