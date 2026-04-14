import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../../i18n/useI18n.js'
import styles from './LanguageSwitcher.module.css'

function LanguageSwitcher() {
  const { language, languages, setLanguage, t } = useI18n()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const activeLanguage = languages.find((option) => option.code === language) ?? languages[0]

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div ref={rootRef} className={styles.switcher}>
      <button
        type="button"
        className={open ? `${styles.trigger} ${styles.triggerOpen}` : styles.trigger}
        aria-label={t('header.languageSwitcher')}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
        title={activeLanguage.label}
      >
        <span aria-hidden="true" className={styles.flag}>
          {activeLanguage.flag}
        </span>
      </button>

      {open ? (
        <div className={styles.menu} role="menu" aria-label={t('header.languageSwitcher')}>
          {languages.map((option) => {
            const isActive = option.code === language

            return (
              <button
                key={option.code}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                className={isActive ? `${styles.option} ${styles.optionActive}` : styles.option}
                onClick={() => {
                  setLanguage(option.code)
                  setOpen(false)
                }}
              >
                <span aria-hidden="true" className={styles.flag}>
                  {option.flag}
                </span>
                <span className={styles.label}>{option.nativeLabel}</span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export default LanguageSwitcher
