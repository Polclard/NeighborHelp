import { buildUploadUrl } from '../../utils/buildUploadUrl.js'
import { useI18n } from '../../i18n/useI18n.js'
import EmptyState from '../ui/EmptyState.jsx'
import styles from './PostPhotoGallery.module.css'

function PostPhotoGallery({ photos, editable = false, onRemove = null, removingPhotoId = null }) {
  const { t } = useI18n()

  if (!photos.length) {
    return (
      <EmptyState
        title={t('postPhotoGallery.emptyTitle')}
        description={t('postPhotoGallery.emptyDescription')}
      />
    )
  }

  return (
    <div className={styles.gallery}>
      {photos.map((photo) => (
        <figure key={photo.id} className={styles.item}>
          <img src={buildUploadUrl(photo.filePath)} alt={t('postPhotoGallery.imageAlt')} />
          {editable && onRemove ? (
            <button
              className={styles.remove}
              type="button"
              onClick={() => onRemove(photo.id)}
              disabled={removingPhotoId === photo.id}
            >
              {removingPhotoId === photo.id ? t('postPhotoGallery.removing') : t('common.actions.remove')}
            </button>
          ) : null}
        </figure>
      ))}
    </div>
  )
}

export default PostPhotoGallery
