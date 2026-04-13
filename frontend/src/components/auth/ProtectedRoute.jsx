import {Navigate, Outlet, useLocation} from 'react-router-dom'
import {useAppSelector} from '../../hooks/useAppSelector.js'

function ProtectedRoute({requiredRole = null}) {
    const location = useLocation()
    const {bootstrapStatus, currentUser} = useAppSelector((state) => state.auth)

    if (bootstrapStatus !== 'ready') {
        return <p style={{padding: '2rem'}}>Restoring session...</p>
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