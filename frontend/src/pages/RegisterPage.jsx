import {yupResolver} from '@hookform/resolvers/yup'
import {startTransition} from 'react'
import {useForm} from 'react-hook-form'
import {Link, Navigate, useNavigate} from 'react-router-dom'
import * as yup from 'yup'
import {clearAuthError, registerUser} from '../features/auth/authSlice.js'
import {useAppDispatch} from '../hooks/useAppDispatch.js'
import {useAppSelector} from '../hooks/useAppSelector.js'
import {useI18n} from '../i18n/useI18n.js'
import styles from './AuthPage.module.css'

function RegisterPage() {
    const dispatch = useAppDispatch()
    const {t} = useI18n()
    const navigate = useNavigate()
    const {currentUser, error, status} = useAppSelector((state) => state.auth)
    const schema = yup.object({
        firstName: yup.string().trim().required(t('auth.validation.firstNameRequired')).max(100, t('auth.validation.firstNameMax')),
        lastName: yup.string().trim().required(t('auth.validation.lastNameRequired')).max(100, t('auth.validation.lastNameMax')),
        email: yup.string().email(t('auth.validation.emailValid')).required(t('auth.validation.emailRequired')),
        phoneNumber: yup.string().nullable(),
        password: yup
            .string()
            .min(8, t('auth.validation.passwordLength'))
            .max(72, t('auth.validation.passwordLength'))
            .required(t('auth.validation.passwordRequired')),
        confirmPassword: yup
            .string()
            .oneOf([yup.ref('password')], t('auth.validation.passwordsMismatch'))
            .required(t('auth.validation.confirmPasswordRequired')),
    })

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
            <p className={styles.kicker}>{t('auth.kicker')}</p>
            <h2 className={styles.title}>{t('auth.register.title')}</h2>

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
                        <span>{t('auth.firstName')}</span>
                        <input type="text" {...register('firstName')} />
                        <span className={styles.help}>{errors.firstName?.message ?? ''}</span>
                    </label>

                    <label className={styles.field}>
                        <span>{t('auth.lastName')}</span>
                        <input type="text" {...register('lastName')} />
                        <span className={styles.help}>{errors.lastName?.message ?? ''}</span>
                    </label>
                </div>

                <label className={styles.field}>
                    <span>{t('auth.email')}</span>
                    <input type="email" {...register('email')} />
                    <span className={styles.help}>{errors.email?.message ?? ''}</span>
                </label>

                <label className={styles.field}>
                    <span>{t('auth.phoneNumber')}</span>
                    <input type="text" placeholder="+38970123456" {...register('phoneNumber')} />
                    <span className={styles.help}>{errors.phoneNumber?.message ?? ''}</span>
                </label>

                <div className={styles.row}>
                    <label className={styles.field}>
                        <span>{t('auth.password')}</span>
                        <input type="password" {...register('password')} />
                        <span className={styles.help}>{errors.password?.message ?? ''}</span>
                    </label>

                    <label className={styles.field}>
                        <span>{t('auth.confirmPassword')}</span>
                        <input type="password" {...register('confirmPassword')} />
                        <span className={styles.help}>{errors.confirmPassword?.message ?? ''}</span>
                    </label>
                </div>

                <button className={styles.submit} type="submit" disabled={status === 'loading' || isSubmitting}>
                    {status === 'loading' || isSubmitting ? t('auth.creatingAccount') : t('common.actions.register')}
                </button>
            </form>

            <p className={styles.footer}>
                {t('auth.haveAccount')} <Link to="/login">{t('common.actions.signIn')}</Link>
            </p>
        </section>
    )
}

export default RegisterPage
