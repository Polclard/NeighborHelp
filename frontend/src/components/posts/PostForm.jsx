import { getPostFormTypeOptions } from '../../constants/posts.js'
import { useI18n } from '../../i18n/useI18n.js'
import FormField from '../ui/FormField.jsx'
import PostMap from './PostMap.jsx'
import styles from './PostForm.module.css'

function PostForm({
  mode,
  values,
  errors,
  submitLabel,
  submitting,
  selectedFiles,
  onFilesChange,
  onChange,
  onMapPick,
  onSubmit,
  onUseCurrentLocation,
  locationStatus,
  locationError,
}) {
  const { t } = useI18n()
  const postFormTypeOptions = getPostFormTypeOptions(t)
  const selection = values.latitude && values.longitude
    ? { latitude: Number(values.latitude), longitude: Number(values.longitude) }
    : null

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.row}>
        <FormField label={t('postForm.title')} error={errors.title}>
          <input
            type="text"
            name="title"
            value={values.title}
            maxLength={100}
            onChange={(event) => onChange({ title: event.target.value })}
          />
        </FormField>

        <FormField label={t('filters.category.label')} error={errors.category}>
          <input
            type="text"
            name="category"
            value={values.category}
            placeholder={t('postForm.categoryPlaceholder')}
            onChange={(event) => onChange({ category: event.target.value })}
          />
        </FormField>
      </div>

      <div className={styles.row}>
        <FormField label={t('filters.postType.label')} help={mode === 'edit' ? t('postForm.postTypeLocked') : ''}>
          <select
            value={values.postType}
            disabled={mode === 'edit'}
            onChange={(event) => onChange({ postType: event.target.value })}
          >
            {postFormTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label={t('postForm.addressLabel')} error={errors.addressLabel} help={t('postForm.addressHelp')}>
          <input
            type="text"
            name="addressLabel"
            value={values.addressLabel}
            placeholder={t('postForm.addressPlaceholder')}
            onChange={(event) => onChange({ addressLabel: event.target.value })}
          />
        </FormField>
      </div>

      <FormField label={t('postForm.description')} error={errors.description}>
        <textarea
          name="description"
          value={values.description}
          maxLength={5000}
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </FormField>

      <div className={styles.row}>
        <FormField label={t('postForm.latitude')} error={errors.latitude}>
          <input
            type="number"
            name="latitude"
            value={values.latitude}
            step="0.000001"
            onChange={(event) => onChange({ latitude: event.target.value })}
          />
        </FormField>

        <FormField label={t('postForm.longitude')} error={errors.longitude}>
          <input
            type="number"
            name="longitude"
            value={values.longitude}
            step="0.000001"
            onChange={(event) => onChange({ longitude: event.target.value })}
          />
        </FormField>
      </div>

      <div className={styles.locationActions}>
        <button className={styles.locationButton} type="button" onClick={onUseCurrentLocation}>
          {locationStatus === 'loading' ? t('filters.location.locating') : t('common.actions.useCurrentLocation')}
        </button>
        <p className={locationError ? styles.locationError : styles.locationHelp}>
          {locationError || t('postForm.locationHelp')}
        </p>
      </div>

      <PostMap
        markers={selection ? [{ id: 'selection', title: t('postForm.selectedLocationTitle'), ...selection, postType: values.postType, status: 'REQUESTING', category: values.category || t('postMap.selectedSpot') }] : []}
        selection={selection}
        center={selection ? [selection.latitude, selection.longitude] : undefined}
        zoom={selection ? 15 : 13}
        onMapPick={onMapPick}
      />

      <div className={styles.row}>
        <FormField
          label={t('postForm.contactPhone')}
          error={errors.contactPhone}
          help={t('postForm.contactPhoneHelp')}
        >
          <input
            type="text"
            name="contactPhone"
            value={values.contactPhone}
            placeholder="+38970123456"
            onChange={(event) => onChange({ contactPhone: event.target.value })}
          />
        </FormField>

        <FormField
          label={t('postForm.contactEmail')}
          error={errors.contactEmail}
          help={t('postForm.contactEmailHelp')}
        >
          <input
            type="email"
            name="contactEmail"
            value={values.contactEmail}
            placeholder="you@example.com"
            onChange={(event) => onChange({ contactEmail: event.target.value })}
          />
        </FormField>
      </div>

      <FormField label={t('postForm.photos')} help={t('postForm.photosHelp')}>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onFilesChange} />
      </FormField>

      {selectedFiles.length ? (
        <ul className={styles.files}>
          {selectedFiles.map((file) => (
            <li key={`${file.name}-${file.size}`}>{file.name}</li>
          ))}
        </ul>
      ) : null}

      <button className={styles.submit} type="submit" disabled={submitting}>
        {submitting ? t('postForm.saving') : submitLabel}
      </button>
    </form>
  )
}

export default PostForm
