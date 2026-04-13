import { startTransition, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import PostForm from '../components/posts/PostForm.jsx'
import PostPhotoGallery from '../components/posts/PostPhotoGallery.jsx'
import SurfaceCard from '../components/ui/SurfaceCard.jsx'
import {
  clearActivePost,
  clearPostsError,
  createPost,
  deletePostPhoto,
  fetchPostDetail,
  updatePost,
  uploadPostPhoto,
} from '../features/posts/postsSlice.js'
import { useBrowserLocation } from '../hooks/useBrowserLocation.js'
import { useAppDispatch } from '../hooks/useAppDispatch.js'
import { useAppSelector } from '../hooks/useAppSelector.js'
import styles from './PostEditorPage.module.css'

const emptyValues = {
  title: '',
  description: '',
  postType: 'SERVICE_REQUEST',
  category: '',
  latitude: '',
  longitude: '',
  addressLabel: '',
  contactPhone: '',
  contactEmail: '',
}

function PostEditorPage({ mode }) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { postId } = useParams()
  const { currentUser } = useAppSelector((state) => state.auth)
  const { activePost, detailStatus, error, photoStatus, saveStatus } = useAppSelector((state) => state.posts)

  useEffect(() => {
    dispatch(clearPostsError())

    if (mode === 'edit' && postId) {
      dispatch(fetchPostDetail(postId))
    }

    return () => {
      dispatch(clearActivePost())
    }
  }, [dispatch, mode, postId])

  if (mode === 'edit' && detailStatus === 'loading' && !activePost) {
    return (
      <SurfaceCard eyebrow="Posts" title="Loading post editor">
        <p className={styles.copy}>Fetching the current post values...</p>
      </SurfaceCard>
    )
  }

  if (mode === 'edit' && activePost && currentUser?.id !== activePost.userId) {
    return <Navigate to={`/posts/${activePost.id}`} replace />
  }

  const submitting = saveStatus === 'loading' || photoStatus === 'loading'
  const initialValues =
    mode === 'edit' && activePost
      ? {
          title: activePost.title ?? '',
          description: activePost.description ?? '',
          postType: activePost.postType ?? 'SERVICE_REQUEST',
          category: activePost.category ?? '',
          latitude: activePost.latitude?.toString() ?? '',
          longitude: activePost.longitude?.toString() ?? '',
          addressLabel: activePost.addressLabel ?? '',
          contactPhone: activePost.contactPhone ?? '',
          contactEmail: activePost.contactEmail ?? '',
        }
      : emptyValues

  return (
    <div className={styles.page}>
      <SurfaceCard
        eyebrow="Posts"
        title={mode === 'edit' ? 'Edit your post' : 'Create a new post'}
        description="The create and edit flows now share the same form, location picker, and upload flow."
        actions={
          <Link className={styles.secondaryAction} to={mode === 'edit' && postId ? `/posts/${postId}` : '/posts'}>
            Back
          </Link>
        }
      >
        {error ? <p className={styles.error}>{error}</p> : null}

        <PostEditorForm
          key={mode === 'edit' && activePost ? `${activePost.id}-${activePost.updatedAt}` : mode}
          dispatch={dispatch}
          initialValues={initialValues}
          mode={mode}
          navigate={navigate}
          postId={postId}
          submitLabel={mode === 'edit' ? 'Save changes' : 'Create post'}
          submitting={submitting}
        />
      </SurfaceCard>

      {mode === 'edit' && activePost ? (
        <SurfaceCard title="Existing photos" description="Photos can be removed individually while the post is still editable.">
          <PostPhotoGallery
            editable
            onRemove={async (photoId) => {
              try {
                await dispatch(deletePostPhoto({ postId: activePost.id, photoId })).unwrap()
              } catch {
                // The slice already stores the API error for the page.
              }
            }}
            photos={activePost.photos}
          />
        </SurfaceCard>
      ) : null}
    </div>
  )
}

function PostEditorForm({ dispatch, initialValues, mode, navigate, postId, submitLabel, submitting }) {
  const [formValues, setFormValues] = useState(initialValues)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [validationErrors, setValidationErrors] = useState({})
  const { error: locationError, requestLocation, status: locationStatus, position } = useBrowserLocation(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setValidationErrors({})

    const payload = buildPayload(formValues, mode)

    try {
      const savedPost =
        mode === 'edit'
          ? await dispatch(updatePost({ postId, values: payload })).unwrap()
          : await dispatch(createPost(payload)).unwrap()

      for (const file of selectedFiles) {
        await dispatch(uploadPostPhoto({ postId: savedPost.id, file })).unwrap()
      }

      startTransition(() => {
        navigate(`/posts/${savedPost.id}`, { replace: true })
      })
    } catch (requestError) {
      setValidationErrors(requestError?.validationErrors ?? {})
    }
  }

  return (
    <PostForm
      errors={validationErrors}
      locationError={locationError}
      locationStatus={locationStatus}
      mode={mode}
      onChange={(nextValues) => setFormValues((current) => ({ ...current, ...nextValues }))}
      onFilesChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []).slice(0, 5))}
      onMapPick={(selection) =>
        setFormValues((current) => ({
          ...current,
          latitude: selection.latitude.toFixed(6),
          longitude: selection.longitude.toFixed(6),
        }))
      }
      onSubmit={handleSubmit}
      onUseCurrentLocation={async () => {
        const nextPosition = locationStatus === 'ready' ? position : await requestLocation()

        if (!nextPosition) {
          return
        }

        setFormValues((current) => ({
          ...current,
          latitude: nextPosition.latitude.toFixed(6),
          longitude: nextPosition.longitude.toFixed(6),
        }))
      }}
      selectedFiles={selectedFiles}
      submitLabel={submitLabel}
      submitting={submitting}
      values={formValues}
    />
  )
}

function buildPayload(values, mode) {
  const payload = {
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category.trim(),
    latitude: Number(values.latitude),
    longitude: Number(values.longitude),
    addressLabel: normalizeNullable(values.addressLabel),
    contactPhone: normalizeNullable(values.contactPhone),
    contactEmail: normalizeNullable(values.contactEmail),
  }

  if (mode === 'create') {
    return {
      ...payload,
      postType: values.postType,
    }
  }

  return payload
}

function normalizeNullable(value) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export default PostEditorPage
