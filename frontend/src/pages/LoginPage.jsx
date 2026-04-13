import {yupResolver} from '@hookform/resolvers/yup'
import {startTransition} from 'react'
import {useForm} from 'react-hook-form'
import {Link, Navigate, useLocation, useNavigate} from 'react-router-dom'
import * as yup from 'yup'
import {clearAuthError, loginUser} from '../features/auth/authSlice.js'
import {useAppDispatch} from '../hooks/useAppDispatch.js'
import {useAppSelector} from '../hooks/useAppSelector.js'
import styles from './AuthPage.module.css'

const schema = yup.object({
    email: yup.string().email('Email must be valid').required('Email is required'),
    password: yup
        .string()
        .min(8, 'Password must be between 8 and 72 characters')
        .max(72, 'Password must be between 8 and 72 characters')
        .required('Password is required'),
})

function LoginPage() {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const location = useLocation()
    const {currentUser, error, status} = useAppSelector((state) => state.auth)
    const redirectTarget = location.state?.from?.pathname ?? '/profile'

    const {
        register,
        handleSubmit,
        formState: {errors, isSubmitting},
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    const onSubmit = handleSubmit(async (values) => {
        await dispatch(loginUser(values)).unwrap()

        startTransition(() => {
            navigate(redirectTarget, {replace: true})
        })
    })

    if (currentUser) {
        return <Navigate to={redirectTarget} replace/>
    }

    return (
        <section className={styles.page}>
            <p className={styles.kicker}>Auth</p>
            <h2 className={styles.title}>Sign in to continue</h2>
            <p className={styles.copy}>
                This connects directly to the existing Spring Boot auth endpoints and restores the in-memory access
                token from the refresh cookie when needed.
            </p>

            {error ? <p className={styles.error}>{error}</p> : null}

            <form
                className={styles.form}
                onSubmit={onSubmit}
                onInput={() => {
                    if (error) {
                        dispatch(clearAuthError())
                    }
                }}
            >
                <label className={styles.field}>
                    <span>Email</span>
                    <input type="email" placeholder="you@example.com" {...register('email')} />
                    <span className={styles.help}>{errors.email?.message ?? ''}</span>
                </label>

                <label className={styles.field}>
                    <span>Password</span>
                    <input type="password" placeholder="Your password" {...register('password')} />
                    <span className={styles.help}>{errors.password?.message ?? ''}</span>
                </label>

                <button className={styles.submit} type="submit" disabled={status === 'loading' || isSubmitting}>
                    {status === 'loading' || isSubmitting ? 'Signing in...' : 'Login'}
                </button>
            </form>

            <p className={styles.footer}>
                Need an account? <Link to="/register">Create one</Link>
            </p>
        </section>
    )
}

export default LoginPage