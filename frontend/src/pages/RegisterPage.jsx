import {yupResolver} from '@hookform/resolvers/yup'
import {startTransition} from 'react'
import {useForm} from 'react-hook-form'
import {Link, Navigate, useNavigate} from 'react-router-dom'
import * as yup from 'yup'
import {clearAuthError, registerUser} from '../features/auth/authSlice.js'
import {useAppDispatch} from '../hooks/useAppDispatch.js'
import {useAppSelector} from '../hooks/useAppSelector.js'
import styles from './AuthPage.module.css'

const schema = yup.object({
    firstName: yup.string().trim().required('First name is required').max(100, 'First name must be at most 100 characters'),
    lastName: yup.string().trim().required('Last name is required').max(100, 'Last name must be at most 100 characters'),
    email: yup.string().email('Email must be valid').required('Email is required'),
    phoneNumber: yup.string().nullable(),
    password: yup
        .string()
        .min(8, 'Password must be between 8 and 72 characters')
        .max(72, 'Password must be between 8 and 72 characters')
        .required('Password is required'),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref('password')], 'Passwords do not match')
        .required('Confirm password is required'),
})

function RegisterPage() {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const {currentUser, error, status} = useAppSelector((state) => state.auth)

    const {
        register,
        handleSubmit,
        formState: {errors, isSubmitting},
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            phoneNumber: '',
            password: '',
            confirmPassword: '',
        },
    })

    const onSubmit = handleSubmit(async (values) => {
        await dispatch(registerUser(values)).unwrap()

        startTransition(() => {
            navigate('/profile', {replace: true})
        })
    })

    if (currentUser) {
        return <Navigate to="/profile" replace/>
    }

    return (
        <section className={styles.page}>
            <p className={styles.kicker}>Auth</p>
            <h2 className={styles.title}>Create your account</h2>
            <p className={styles.copy}>
                This form should match the backend register contract exactly, including field names and validation
                messages.
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
                <div className={styles.row}>
                    <label className={styles.field}>
                        <span>First name</span>
                        <input type="text" {...register('firstName')} />
                        <span className={styles.help}>{errors.firstName?.message ?? ''}</span>
                    </label>

                    <label className={styles.field}>
                        <span>Last name</span>
                        <input type="text" {...register('lastName')} />
                        <span className={styles.help}>{errors.lastName?.message ?? ''}</span>
                    </label>
                </div>

                <label className={styles.field}>
                    <span>Email</span>
                    <input type="email" {...register('email')} />
                    <span className={styles.help}>{errors.email?.message ?? ''}</span>
                </label>

                <label className={styles.field}>
                    <span>Phone number</span>
                    <input type="text" placeholder="+38970123456" {...register('phoneNumber')} />
                    <span className={styles.help}>{errors.phoneNumber?.message ?? ''}</span>
                </label>

                <div className={styles.row}>
                    <label className={styles.field}>
                        <span>Password</span>
                        <input type="password" {...register('password')} />
                        <span className={styles.help}>{errors.password?.message ?? ''}</span>
                    </label>

                    <label className={styles.field}>
                        <span>Confirm password</span>
                        <input type="password" {...register('confirmPassword')} />
                        <span className={styles.help}>{errors.confirmPassword?.message ?? ''}</span>
                    </label>
                </div>

                <button className={styles.submit} type="submit" disabled={status === 'loading' || isSubmitting}>
                    {status === 'loading' || isSubmitting ? 'Creating account...' : 'Register'}
                </button>
            </form>

            <p className={styles.footer}>
                Already have an account? <Link to="/login">Sign in</Link>
            </p>
        </section>
    )
}

export default RegisterPage