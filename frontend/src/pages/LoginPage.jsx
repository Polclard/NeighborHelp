import {yupResolver} from '@hookform/resolvers/yup'
import {startTransition} from 'react'
import {useForm} from 'react-hook-form'
import {Link, Navigate, useLocation, useNavigate} from 'react-router-dom'
import * as yup from 'yup'
import {clearAuthError, loginUser} from '../features/auth/authSlice.js'
import {useAppDispatch} from '../hooks/useAppDispatch.js'
import {useAppSelector} from '../hooks/useAppSelector.js'
import {useI18n} from '../i18n/useI18n.js'
import styles from './AuthPage.module.css'

function LoginPage() {
    const dispatch = useAppDispatch()
    const {t} = useI18n()
    const navigate = useNavigate()
    const location = useLocation()
    const {currentUser, error, notice, status} = useAppSelector((state) => state.auth)
    const redirectTarget = location.state?.from?.pathname ?? '/profile'
    const schema = yup.object({
        email: yup.string().email(t('auth.validation.emailValid')).required(t('auth.validation.emailRequired')),
        password: yup
            .string()
            .min(8, t('auth.validation.passwordLength'))
            .max(72, t('auth.validation.passwordLength'))
            .required(t('auth.validation.passwordRequired')),
    })

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
            <p className={styles.kicker}>{t('auth.kicker')}</p>
            <h2 className={styles.title}>{t('auth.login.title')}</h2>

            {notice ? <p className={styles.notice}>{notice}</p> : null}
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
                    <span>{t('auth.email')}</span>
                    <input type="email" placeholder={t('auth.emailPlaceholder')} {...register('email')} />
                    <span className={styles.help}>{errors.email?.message ?? ''}</span>
                </label>

                <label className={styles.field}>
                    <span>{t('auth.password')}</span>
                    <input type="password" placeholder={t('auth.passwordPlaceholder')} {...register('password')} />
                    <span className={styles.help}>{errors.password?.message ?? ''}</span>
                </label>

                <button className={styles.submit} type="submit" disabled={status === 'loading' || isSubmitting}>
                    {status === 'loading' || isSubmitting ? t('auth.signingIn') : t('common.actions.login')}
                </button>
            </form>

            <p className={styles.footer}>
                {t('auth.needAccount')} <Link to="/register">{t('auth.createOne')}</Link>
            </p>
        </section>
    )
}

export default LoginPage
