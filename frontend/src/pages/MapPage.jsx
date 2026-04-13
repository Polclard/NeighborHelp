import { useDeferredValue, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PostCard from '../components/posts/PostCard.jsx'
import PostFilters from '../components/posts/PostFilters.jsx'
import PostMap from '../components/posts/PostMap.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import SpotlightSearch from '../components/ui/SpotlightSearch.jsx'
import { calculateDistanceKm } from '../utils/calculateDistanceKm.js'
import { useBrowserLocation } from '../hooks/useBrowserLocation.js'
import { useAppDispatch } from '../hooks/useAppDispatch.js'
import { useAppSelector } from '../hooks/useAppSelector.js'
import { mapViewportChanged, markerSelected } from '../features/map/mapSlice.js'
import {
  fetchBrowseFeed,
  postFiltersChanged,
  selectedPostChanged,
} from '../features/posts/postsSlice.js'
import { fetchPublicProfile as fetchPublicProfileRequest } from '../services/api/profileApi.js'
import styles from './MapPage.module.css'

function MapPage() {
  const dispatch = useAppDispatch()
  const { currentUser } = useAppSelector((state) => state.auth)
  const { center, zoom } = useAppSelector((state) => state.map)
  const { browseStatus, error, filters, markers, publicItems, selectedPostId } = useAppSelector(
    (state) => state.posts,
  )
  const deferredKeyword = useDeferredValue(filters.keyword)
  const [ownerProfiles, setOwnerProfiles] = useState({})
  const { error: locationError, position, requestLocation, status: locationStatus } = useBrowserLocation(true)
  const filterLatitude = filters.location?.latitude ?? null
  const filterLongitude = filters.location?.longitude ?? null

  useEffect(() => {
    dispatch(
      fetchBrowseFeed({
        category: filters.category,
        keyword: deferredKeyword,
        location:
          filterLatitude != null && filterLongitude != null
            ? {
                latitude: filterLatitude,
                longitude: filterLongitude,
              }
            : null,
        postType: filters.postType,
        radiusKm: filters.radiusKm,
        status: filters.status,
      }),
    )
  }, [
    deferredKeyword,
    dispatch,
    filters.category,
    filterLatitude,
    filterLongitude,
    filters.postType,
    filters.radiusKm,
    filters.status,
  ])

  useEffect(() => {
    if (
      locationStatus === 'ready' &&
      filterLatitude == null &&
      filterLongitude == null
    ) {
      dispatch(mapViewportChanged({ center: [position.latitude, position.longitude], zoom: 13 }))
    }
  }, [
    dispatch,
    filterLatitude,
    filterLongitude,
    locationStatus,
    position.latitude,
    position.longitude,
  ])

  useEffect(() => {
    const userIds = [...new Set(publicItems.map((post) => post.userId))].filter((userId) => !ownerProfiles[userId])

    if (!userIds.length) {
      return
    }

    let active = true

    Promise.allSettled(userIds.map((userId) => fetchPublicProfileRequest(userId))).then((results) => {
      if (!active) {
        return
      }

      const nextProfiles = {}

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          nextProfiles[result.value.id] = result.value
        }
      })

      if (Object.keys(nextProfiles).length) {
        setOwnerProfiles((current) => ({ ...current, ...nextProfiles }))
      }
    })

    return () => {
      active = false
    }
  }, [ownerProfiles, publicItems])

  const selectedPost = publicItems.find((post) => post.id === selectedPostId) ?? publicItems[0] ?? null
  const selectedOwner = selectedPost ? ownerProfiles[selectedPost.userId] ?? null : null
  const requestCount = publicItems.filter((post) => post.postType === 'SERVICE_REQUEST').length
  const offerCount = publicItems.length - requestCount
  const resultLabel = `${publicItems.length} ${publicItems.length === 1 ? 'result' : 'results'}`
  const hasLocationFilter = filterLatitude != null && filterLongitude != null
  const markerDetails = {}

  publicItems.forEach((post) => {
    const ownerProfile = ownerProfiles[post.userId] ?? null
    const ownerName = ownerProfile ? `${ownerProfile.firstName} ${ownerProfile.lastName}` : 'Neighbor'

    markerDetails[post.id] = {
      description: post.description,
      distanceKm:
        locationStatus === 'ready'
          ? calculateDistanceKm(position, {
              latitude: Number(post.latitude),
              longitude: Number(post.longitude),
            })
          : null,
      ownerAvatar: ownerProfile?.profilePicture ?? null,
      ownerName,
    }
  })

  const handleSelectPost = (post) => {
    dispatch(selectedPostChanged(post.id))
    dispatch(markerSelected(post.id))
    dispatch(mapViewportChanged({ center: [Number(post.latitude), Number(post.longitude)], zoom: 15 }))
  }

  const handleUseLocation = async () => {
    const nextPosition = locationStatus === 'ready' ? position : await requestLocation()

    if (!nextPosition) {
      return
    }

    dispatch(
      postFiltersChanged({
        location: nextPosition,
        radiusKm: filters.radiusKm || '5',
      }),
    )
    dispatch(mapViewportChanged({ center: [nextPosition.latitude, nextPosition.longitude], zoom: 13 }))
  }

  return (
    <div className={styles.page}>
      <div className={styles.mapStage}>
        <div className={styles.mapLayer}>
          <PostMap
            markers={markers}
            center={center}
            markerDetails={markerDetails}
            selectedMarkerId={selectedPost?.id ?? null}
            zoom={zoom}
            onMarkerSelect={(postId) => {
              const target = publicItems.find((post) => post.id === postId)
              if (target) {
                handleSelectPost(target)
              }
            }}
            variant="immersive"
            viewerPosition={locationStatus === 'ready' ? position : null}
          />
        </div>

        <div className={styles.searchOverlay}>
          <SpotlightSearch
            label="Search the neighborhood"
            onChange={(keyword) => dispatch(postFiltersChanged({ keyword }))}
            onClear={() => dispatch(postFiltersChanged({ keyword: '' }))}
            placeholder="Search requests, offers, categories, or neighborhoods"
            value={filters.keyword}
          />
        </div>

        <div className={styles.mapLegend}>
          <span className={styles.requestChip}>Requests {requestCount}</span>
          <span className={styles.offerChip}>Offers {offerCount}</span>
          <span className={styles.metaChip}>
            {locationStatus === 'ready' ? 'Using your current position' : 'Using public city view'}
          </span>
        </div>
      </div>

      <aside className={styles.sidebar}>
        <div className={styles.sidebarPanel}>
          <div className={styles.sidebarHeader}>
            <p className={styles.eyebrow}>Live neighborhood board</p>
            <h1>Discover nearby help</h1>
            <p>
              The map is the primary surface. Search from the top, refine the board here, and jump between pins and posts without leaving the screen.
            </p>
          </div>

          <div className={styles.actionRow}>
            {currentUser ? (
              <>
                <Link className={styles.primaryAction} to="/posts/new">
                  Create post
                </Link>
                <Link className={styles.secondaryAction} to="/posts">
                  Manage mine
                </Link>
              </>
            ) : (
              <>
                <Link className={styles.primaryAction} to="/register">
                  Join NeighborHelp
                </Link>
                <Link className={styles.secondaryAction} to="/login">
                  Sign in
                </Link>
              </>
            )}
          </div>

          <section className={styles.filtersPanel}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionLabel}>Filters</p>
                <h2>Refine the map</h2>
              </div>
              <button
                className={styles.ghostAction}
                type="button"
                onClick={() =>
                  dispatch(
                    postFiltersChanged({
                      category: '',
                      keyword: '',
                      postType: 'ALL',
                      status: 'ALL',
                      radiusKm: '',
                      location: null,
                    }),
                  )
                }
              >
                Reset
              </button>
            </div>

            <PostFilters
              filters={filters}
              locationError={locationError}
              locationStatus={locationStatus}
              onChange={(nextFilters) => dispatch(postFiltersChanged(nextFilters))}
              onUseLocation={handleUseLocation}
              showKeyword={false}
            />
          </section>

          {selectedPost ? (
            <section className={styles.focusCard}>
              <p className={styles.sectionLabel}>Focused pin</p>
              <h2>{selectedPost.title}</h2>
              <p>{selectedPost.description}</p>
              <div className={styles.focusMeta}>
                <span>{selectedOwner ? `${selectedOwner.firstName} ${selectedOwner.lastName}` : 'Neighbor'}</span>
                {markerDetails[selectedPost.id]?.distanceKm !== null ? (
                  <span>{markerDetails[selectedPost.id].distanceKm.toFixed(1)} km away</span>
                ) : null}
              </div>
              <div className={styles.actionRow}>
                <Link className={styles.primaryAction} to={`/posts/${selectedPost.id}`}>
                  Open details
                </Link>
                {selectedOwner ? (
                  <Link className={styles.secondaryAction} to={`/profiles/${selectedOwner.id}`}>
                    View profile
                  </Link>
                ) : null}
              </div>
            </section>
          ) : null}

          <section className={styles.resultsPanel}>
            <div className={styles.listHeader}>
              <div className={styles.listTitleBlock}>
                <div className={styles.listTitleRow}>
                  <p className={styles.sectionLabel}>Posts</p>
                  <span className={styles.resultBadge}>{resultLabel}</span>
                </div>
                <h2>Matches near you</h2>
              </div>
              <p className={styles.listMeta}>
                {hasLocationFilter
                  ? `${filters.radiusKm || 'Any'} km around your chosen location`
                  : 'Showing the public city-wide board'}
              </p>
            </div>

            {error ? <p className={styles.error}>{error}</p> : null}

            <div className={styles.listArea}>
              {browseStatus === 'loading' ? (
                <p className={styles.loading}>Loading public posts...</p>
              ) : publicItems.length ? (
                <div className={styles.list}>
                  {publicItems.map((post) => (
                    <PostCard
                      key={post.id}
                      distanceKm={markerDetails[post.id]?.distanceKm ?? null}
                      isSelected={post.id === selectedPost?.id}
                      onSelect={handleSelectPost}
                      ownerProfile={ownerProfiles[post.userId] ?? null}
                      post={post}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No posts matched these filters"
                  description="Broaden the keyword, clear the radius, or switch the lifecycle filters to see more nearby work."
                />
              )}
            </div>
          </section>
        </div>
      </aside>
    </div>
  )
}

export default MapPage
