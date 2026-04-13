import { browseStatusOptions, postTypeOptions, radiusOptions } from '../../constants/posts.js'
import FormField from '../ui/FormField.jsx'
import styles from './PostFilters.module.css'

function PostFilters({ filters, onChange, onUseLocation, locationStatus, locationError, showKeyword = true }) {
  return (
    <div className={styles.filters}>
      {showKeyword ? (
        <div className={styles.row}>
          <FormField label="Keyword" help="Search post titles and descriptions.">
            <input
              type="search"
              name="keyword"
              value={filters.keyword}
              placeholder="Plumbing, groceries, moving boxes..."
              onChange={(event) => onChange({ keyword: event.target.value })}
            />
          </FormField>

          <FormField label="Category" help="Filter by a free-text service category.">
            <input
              type="text"
              name="category"
              value={filters.category}
              placeholder="Plumbing"
              onChange={(event) => onChange({ category: event.target.value })}
            />
          </FormField>
        </div>
      ) : (
        <div className={styles.singleField}>
          <FormField label="Category" help="Filter by a free-text service category.">
            <input
              type="text"
              name="category"
              value={filters.category}
              placeholder="Plumbing"
              onChange={(event) => onChange({ category: event.target.value })}
            />
          </FormField>
        </div>
      )}

      <div className={styles.row}>
        <FormField label="Post type">
          <select value={filters.postType} onChange={(event) => onChange({ postType: event.target.value })}>
            {postTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Status">
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
        <FormField label="Radius">
          <select value={filters.radiusKm} onChange={(event) => onChange({ radiusKm: event.target.value })}>
            {radiusOptions.map((option) => (
              <option key={option.value || 'none'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <div className={styles.locationCard}>
          <p className={styles.locationLabel}>Location filter</p>
          <p className={styles.locationText}>
            {filters.location
              ? `${Number(filters.location.latitude).toFixed(4)}, ${Number(filters.location.longitude).toFixed(4)}`
              : 'Using the full public map'}
          </p>
          <button className={styles.locationAction} type="button" onClick={onUseLocation}>
            {locationStatus === 'loading' ? 'Locating...' : 'Use my location'}
          </button>
          {filters.location ? (
            <button className={styles.clearAction} type="button" onClick={() => onChange({ location: null })}>
              Clear location
            </button>
          ) : null}
          {locationError ? <p className={styles.locationError}>{locationError}</p> : null}
        </div>
      </div>
    </div>
  )
}

export default PostFilters
