import { Link } from 'react-router-dom'
import styles from './NotFoundPage.module.css'

function NotFoundPage() {
  return (
    <section className={styles.page}>
      <p className={styles.code}>404</p>
      <h1>That route does not exist.</h1>
      <p>
        The application has real screens now, but this URL is outside the current route tree.
      </p>
      <Link className={styles.link} to="/">
        Return to the app shell
      </Link>
    </section>
  )
}

export default NotFoundPage
