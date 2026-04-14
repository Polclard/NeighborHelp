import {Navigate, Outlet, useLocation} from 'react-router-dom'
import {useAppSelector} from '../../hooks/useAppSelector.js'
import {useI18n} from '../../i18n/useI18n.js'

function ProtectedRoute({requiredRole = null}) {
    const {t} = useI18n()
    const location = useLocation()
    const {bootstrapStatus, currentUser} = useAppSelector((state) => state.auth)

    if (bootstrapStatus !== 'ready') {
        return <p style={{padding: '2rem'}}>{t('protected.restoring')}</p>
    }

    if (!currentUser) {
        return <Navigate to="/login" replace state={{from: location}}/>
    }

    if (requiredRole && currentUser.role !== requiredRole) {
        return <Navigate to="/" replace/>
    }

    return <Outlet/>
}

export default ProtectedRoute
