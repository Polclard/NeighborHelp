import { useEffect, useId, useRef, useState } from 'react'
import styles from './SpotlightSearch.module.css'

function SpotlightSearch({
  label = 'Search the neighborhood',
  onChange,
  onClear,
  placeholder = 'Search requests, offers, or categories',
  value,
}) {
  const inputId = useId()
  const inputRef = useRef(null)
  const [expanded, setExpanded] = useState(Boolean(value))
  const isExpanded = expanded || Boolean(value)

  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target
      const isTypingTarget =
        target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setExpanded(true)
        inputRef.current?.focus()
        inputRef.current?.select()
        return
      }

      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !isTypingTarget) {
        event.preventDefault()
        setExpanded(true)
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleExpand = () => {
    setExpanded(true)
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }

  const handleCollapse = () => {
    if (value) {
      return
    }

    setExpanded(false)
  }

  return (
    <section
      className={isExpanded ? `${styles.shell} ${styles.shellExpanded}` : styles.shell}
      aria-label={label}
      onClick={!isExpanded ? handleExpand : undefined}
    >
      <button className={styles.launcher} type="button" onClick={handleExpand}>
        <span className={styles.badge}>Search</span>
        <span className={styles.launcherLabel}>{label}</span>
        <span className={styles.shortcut}>Cmd/Ctrl + K</span>
      </button>

      <div className={isExpanded ? `${styles.field} ${styles.fieldExpanded}` : styles.field}>
        <input
          id={inputId}
          ref={inputRef}
          className={styles.input}
          type="search"
          value={value}
          onBlur={handleCollapse}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setExpanded(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault()
              inputRef.current?.blur()
              handleCollapse()
            }
          }}
        />

        {value ? (
          <button
            className={styles.clearButton}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onClear()
              requestAnimationFrame(() => {
                inputRef.current?.focus()
              })
            }}
          >
            Clear
          </button>
        ) : (
          <button
            className={styles.closeButton}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={handleCollapse}
          >
            Close
          </button>
        )}
      </div>
    </section>
  )
}

export default SpotlightSearch
