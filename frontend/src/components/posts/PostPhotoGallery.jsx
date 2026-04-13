import { buildUploadUrl } from '../../utils/buildUploadUrl.js'
import EmptyState from '../ui/EmptyState.jsx'
import styles from './PostPhotoGallery.module.css'

function PostPhotoGallery({ photos, editable = false, onRemove = null, removingPhotoId = null }) {
  if (!photos.length) {
    return (
      <EmptyState
        title="No post photos yet"
        description="Photos can be added later to give neighbors more context before they reach out."
      />
    )
  }

  return (
    <div className={styles.gallery}>
      {photos.map((photo) => (
        <figure key={photo.id} className={styles.item}>
          <img src={buildUploadUrl(photo.filePath)} alt="Post" />
          {editable && onRemove ? (
            <button
              className={styles.remove}
              type="button"
              onClick={() => onRemove(photo.id)}
              disabled={removingPhotoId === photo.id}
            >
              {removingPhotoId === photo.id ? 'Removing...' : 'Remove'}
            </button>
          ) : null}
        </figure>
      ))}
    </div>
  )
}

export default PostPhotoGallery

