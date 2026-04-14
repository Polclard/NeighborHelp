import { getBrowseStatusOptions, getPostTypeOptions, getRadiusOptions } from '../../constants/posts.js'
import { useI18n } from '../../i18n/useI18n.js'
import FormField from '../ui/FormField.jsx'
import styles from './PostFilters.module.css'

function PostFilters({ filters, onChange, onUseLocation, locationStatus, locationError, showKeyword = true }) {
  const { t } = useI18n()
  const postTypeOptions = getPostTypeOptions(t)
  const browseStatusOptions = getBrowseStatusOptions(t)
  const radiusOptions = getRadiusOptions(t)

  return (
    <div className={styles.filters}>
      {showKeyword ? (
        <div className={styles.row}>
          <FormField label={t('filters.keyword.label')} help={t('filters.keyword.help')}>
            <input
              type="search"
              name="keyword"
              value={filters.keyword}
              placeholder={t('filters.keyword.placeholder')}
              onChange={(event) => onChange({ keyword: event.target.value })}
            />
          </FormField>

          <FormField label={t('filters.category.label')} help={t('filters.category.help')}>
            <input
              type="text"
              name="category"
              value={filters.category}
              placeholder={t('filters.category.placeholder')}
              onChange={(event) => onChange({ category: event.target.value })}
            />
          </FormField>
        </div>
      ) : (
        <div className={styles.singleField}>
          <FormField label={t('filters.category.label')} help={t('filters.category.help')}>
            <input
              type="text"
              name="category"
              value={filters.category}
              placeholder={t('filters.category.placeholder')}
              onChange={(event) => onChange({ category: event.target.value })}
            />
          </FormField>
        </div>
      )}

      <div className={styles.row}>
        <FormField label={t('filters.postType.label')}>
          <select value={filters.postType} onChange={(event) => onChange({ postType: event.target.value })}>
            {postTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label={t('filters.status.label')}>
          <select value={filters.status} onChange={(event) => onChange({ status: event.target.value })}>
            {browseStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className={styles.row}>
        <FormField label={t('filters.radius.label')}>
          <select value={filters.radiusKm} onChange={(event) => onChange({ radiusKm: event.target.value })}>
            {radiusOptions.map((option) => (
              <option key={option.value || 'none'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <div className={styles.locationCard}>
          <p className={styles.locationLabel}>{t('filters.location.label')}</p>
          <p className={styles.locationText}>
            {filters.location
              ? `${Number(filters.location.latitude).toFixed(4)}, ${Number(filters.location.longitude).toFixed(4)}`
              : t('filters.location.publicMap')}
          </p>
          <button className={styles.locationAction} type="button" onClick={onUseLocation}>
            {locationStatus === 'loading' ? t('filters.location.locating') : t('common.actions.useMyLocation')}
          </button>
          {filters.location ? (
            <button className={styles.clearAction} type="button" onClick={() => onChange({ location: null })}>
              {t('common.actions.clearLocation')}
            </button>
          ) : null}
          {locationError ? <p className={styles.locationError}>{locationError}</p> : null}
        </div>
      </div>
    </div>
  )
}

export default PostFilters
