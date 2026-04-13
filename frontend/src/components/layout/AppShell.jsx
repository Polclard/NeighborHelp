import {startTransition, useState} from 'react'
import ChatRealtimeBridge from '../chat/ChatRealtimeBridge.jsx'
import {Link, NavLink, Outlet, useLocation, useNavigate} from 'react-router-dom'
import {logoutUser} from '../../features/auth/authSlice.js'
import {useAppDispatch} from '../../hooks/useAppDispatch.js'
import {useAppSelector} from '../../hooks/useAppSelector.js'
import {APP_NAME} from '../../constants/env.js'
import {primaryNavigation} from '../../constants/navigation.js'
import styles from './AppShell.module.css'

function AppShell() {
    const dispatch = useAppDispatch()
    const location = useLocation()
    const navigate = useNavigate()
    const {bootstrapStatus, currentUser} = useAppSelector((state) => state.auth)
    const conversations = useAppSelector((state) => state.chat.conversations)
    const [menuOpen, setMenuOpen] = useState(false)
    const isMapRoute = location.pathname === '/map'
    const isAuthenticated = bootstrapStatus === 'ready' && Boolean(currentUser)
    const unreadMessageCount = conversations.reduce(
        (total, conversation) => total + (conversation.unreadCount ?? 0),
        0,
    )
    const visibleNavigation = primaryNavigation.filter((item) => {
        if (item.requiresRole) {
            return currentUser?.role === item.requiresRole
        }

        if (item.requiresAuth) {
            return isAuthenticated
        }

        return true
    })

    const handleLogout = async () => {
        setMenuOpen(false)
        await dispatch(logoutUser())
        startTransition(() => {
            navigate('/map', {replace: true})
        })
    }

    return (
        <div className={isMapRoute ? `${styles.shell} ${styles.shellMap}` : styles.shell}>
            <ChatRealtimeBridge/>
            <header className={isMapRoute ? `${styles.header} ${styles.headerMap}` : styles.header}>
                <Link className={styles.brand} to="/map" onClick={() => setMenuOpen(false)}>
                    {/*<span className={styles.brandMark}>NH</span>*/}
                    <span className={styles.brandMark}><img src={"/neighborhelp_logo.png"} alt={"sad"} width={"auto"}
                                                            height={"60px"} style={{borderRadius: 50}}/></span>
                    <div className={styles.brandCopy}>
                        <span className={styles.brandTitle}>{APP_NAME}</span>
                        <span className={styles.brandTag}>Local help, mapped</span>
                    </div>
                </Link>

                <button
                    type="button"
                    className={styles.menuButton}
                    aria-expanded={menuOpen}
                    aria-controls="primary-navigation"
                    onClick={() => setMenuOpen((current) => !current)}
                >
                    {menuOpen ? 'Close' : 'Menu'}
                </button>

                <nav
                    id="primary-navigation"
                    className={menuOpen ? `${styles.nav} ${styles.navOpen}` : styles.nav}
                    aria-label="Primary navigation"
                >
                    {visibleNavigation.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            aria-label={
                                item.to === '/chat' && unreadMessageCount
                                    ? `${item.label}, ${unreadMessageCount} unread messages`
                                    : item.label
                            }
                            className={({isActive}) =>
                                isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                            }
                            onClick={() => setMenuOpen(false)}
                            end={item.to === '/map'}
                        >
                            <span className={styles.navLabelGroup}>
                                <span>{item.label}</span>
                                {item.to === '/chat' && unreadMessageCount ? (
                                    <span className={styles.navBadge}>
                                        {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                                    </span>
                                ) : null}
                            </span>
                        </NavLink>
                    ))}
                </nav>

                <div className={menuOpen ? `${styles.actions} ${styles.actionsOpen}` : styles.actions}>
                    {bootstrapStatus !== 'ready' ? (
                        <span className={styles.sessionBadge}>Restoring session</span>
                    ) : isAuthenticated ? (
                        <>
                            <Link className={styles.secondaryAction} to="/profile" onClick={() => setMenuOpen(false)}>
                                {currentUser.firstName}
                            </Link>
                            <button type="button" className={styles.primaryAction} onClick={handleLogout}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link className={styles.secondaryAction} to="/login"
                                  onClick={() => setMenuOpen(false)}>Login</Link>
                            <Link className={styles.primaryAction} to="/register" onClick={() => setMenuOpen(false)}>Join
                                now</Link>
                        </>
                    )}
                </div>
            </header>

            <main className={isMapRoute ? `${styles.main} ${styles.mapMain}` : styles.main}>
                <Outlet/>
            </main>
        </div>
    )
}

export default AppShell
