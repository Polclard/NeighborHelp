import {useEffect, useRef} from 'react'
import {AppRouter} from './app/router.jsx'
import {restoreSession} from './features/auth/authSlice.js'
import {useAppDispatch} from './hooks/useAppDispatch.js'

function App() {
    const dispatch = useAppDispatch()
    const bootedRef = useRef(false)

    useEffect(() => {
        if (bootedRef.current) {
            return
        }

        bootedRef.current = true
        dispatch(restoreSession())
    }, [dispatch])

    return <AppRouter/>
}

export default App