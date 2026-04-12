import { NavLink, Outlet } from 'react-router-dom'
import { APP_NAME, API_BASE_URL } from '../../constants/env.js'
import { primaryNavigation } from '../../constants/navigation.js'
import styles from './AppShell.module.css'

function AppShell() {
  return (
    <div className={styles.shell}>
      <div className={styles.aurora} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.brandBlock}>
          <p className={styles.kicker}>Neighbor-to-neighbor assistance</p>
          <div className={styles.brandRow}>
            <span className={styles.brandBadge}>NH</span>
            <div>
              <h1 className={styles.brandTitle}>{APP_NAME}</h1>
              <p className={styles.brandCopy}>
                A map-first local services app with live chat, reviews, and admin moderation.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.utility}>
          <span className={styles.utilityLabel}>API</span>
          <code className={styles.endpoint}>{API_BASE_URL}</code>
          <a
            className={styles.swaggerLink}
            href={`${API_BASE_URL}/swagger-ui.html`}
            target="_blank"
            rel="noreferrer"
          >
            Open Swagger
          </a>
        </div>
      </header>

      <nav className={styles.nav} aria-label="Primary navigation">
        {primaryNavigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
            }
            end={item.to === '/'}
          >
            <span className={styles.navLabel}>{item.label}</span>
            <span className={styles.navMeta}>{item.meta}</span>
          </NavLink>
        ))}
      </nav>

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <p>Commit 18 shell: router, store, API client, STOMP client wrapper, and feature scaffolding.</p>
        <p>Next slices can now plug real auth, map, posts, chat, profile, and admin screens into this shell.</p>
      </footer>
    </div>
  )
}

export default AppShell
