import { postFormTypeOptions } from '../../constants/posts.js'
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
  const selection = values.latitude && values.longitude
    ? { latitude: Number(values.latitude), longitude: Number(values.longitude) }
    : null

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.row}>
        <FormField label="Title" error={errors.title}>
          <input
            type="text"
            name="title"
            value={values.title}
            maxLength={100}
            onChange={(event) => onChange({ title: event.target.value })}
          />
        </FormField>

        <FormField label="Category" error={errors.category}>
          <input
            type="text"
            name="category"
            value={values.category}
            placeholder="Plumbing, shopping, moving..."
            onChange={(event) => onChange({ category: event.target.value })}
          />
        </FormField>
      </div>

      <div className={styles.row}>
        <FormField label="Post type" help={mode === 'edit' ? 'Post type cannot be changed after creation.' : ''}>
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

        <FormField label="Address label" error={errors.addressLabel} help="Optional neighborhood or street hint.">
          <input
            type="text"
            name="addressLabel"
            value={values.addressLabel}
            placeholder="Debar Maalo, behind the market"
            onChange={(event) => onChange({ addressLabel: event.target.value })}
          />
        </FormField>
      </div>

      <FormField label="Description" error={errors.description}>
        <textarea
          name="description"
          value={values.description}
          maxLength={5000}
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </FormField>

      <div className={styles.row}>
        <FormField label="Latitude" error={errors.latitude}>
          <input
            type="number"
            name="latitude"
            value={values.latitude}
            step="0.000001"
            onChange={(event) => onChange({ latitude: event.target.value })}
          />
        </FormField>

        <FormField label="Longitude" error={errors.longitude}>
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
          {locationStatus === 'loading' ? 'Locating...' : 'Use current location'}
        </button>
        <p className={locationError ? styles.locationError : styles.locationHelp}>
          {locationError || 'You can also click the map below to pick a different service location.'}
        </p>
      </div>

      <PostMap
        markers={selection ? [{ id: 'selection', title: 'Selected location', ...selection, postType: values.postType, status: 'REQUESTING', category: values.category || 'Selected spot' }] : []}
        selection={selection}
        center={selection ? [selection.latitude, selection.longitude] : undefined}
        zoom={selection ? 15 : 13}
        onMapPick={onMapPick}
      />

      <div className={styles.row}>
        <FormField
          label="Contact phone"
          error={errors.contactPhone}
          help="Leave blank to use the number from your profile."
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
          label="Contact email"
          error={errors.contactEmail}
          help="Leave blank to use the email from your profile."
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

      <FormField label="Photos" help="Up to 5 JPG, PNG, or WEBP images. They will upload after the post is saved.">
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
        {submitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}

export default PostForm

