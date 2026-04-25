import {useDeferredValue, useEffect, useState} from 'react'
import {Link} from 'react-router-dom'
import PostCard from '../components/posts/PostCard.jsx'
import PostFilters from '../components/posts/PostFilters.jsx'
import PostMap from '../components/posts/PostMap.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import SpotlightSearch from '../components/ui/SpotlightSearch.jsx'
import {calculateDistanceKm} from '../utils/calculateDistanceKm.js'
import {fetchDirectionsRoute} from '../utils/fetchDirectionsRoute.js'
import {useBrowserLocation} from '../hooks/useBrowserLocation.js'
import {useAppDispatch} from '../hooks/useAppDispatch.js'
import {useAppSelector} from '../hooks/useAppSelector.js'
import {mapViewportChanged, markerSelected} from '../features/map/mapSlice.js'
import {fetchBrowseFeed, postFiltersChanged, selectedPostChanged,} from '../features/posts/postsSlice.js'
import {fetchPublicProfile as fetchPublicProfileRequest} from '../services/api/profileApi.js'
import {useI18n} from '../i18n/useI18n.js'
import styles from './MapPage.module.css'

const createIdleDirectionsState = () => ({
    coordinates: [],
    error: null,
    postId: null,
    status: 'idle',
    summary: null,
})

function MapPage() {
    const dispatch = useAppDispatch()
    const {t} = useI18n()
    const {currentUser} = useAppSelector((state) => state.auth)
    const {center, zoom} = useAppSelector((state) => state.map)
    const {browseStatus, error, filters, markers, publicItems, selectedPostId} = useAppSelector(
        (state) => state.posts,
    )
    const deferredKeyword = useDeferredValue(filters.keyword)
    const [mapMode, setMapMode] = useState('2d')
    const [directionsState, setDirectionsState] = useState(createIdleDirectionsState)
    const [ownerProfiles, setOwnerProfiles] = useState({})
    const {error: locationError, position, requestLocation, status: locationStatus} = useBrowserLocation(true)
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
            dispatch(mapViewportChanged({center: [position.latitude, position.longitude], zoom: 13}))
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
                setOwnerProfiles((current) => ({...current, ...nextProfiles}))
            }
        })

        return () => {
            active = false
        }
    }, [ownerProfiles, publicItems])

    const selectedPost = publicItems.find((post) => post.id === selectedPostId) ?? publicItems[0] ?? null
    const directionsStatus = selectedPost && directionsState.postId === selectedPost.id ? directionsState.status : 'idle'
    const directionsCoordinates = selectedPost && directionsState.postId === selectedPost.id ? directionsState.coordinates : []
    const directionsError = selectedPost && directionsState.postId === selectedPost.id ? directionsState.error : null
    const directionsSummary = selectedPost && directionsState.postId === selectedPost.id ? directionsState.summary : null
    const selectedOwner = selectedPost ? ownerProfiles[selectedPost.userId] ?? null : null
    const requestCount = publicItems.filter((post) => post.postType === 'SERVICE_REQUEST').length
    const offerCount = publicItems.length - requestCount
    const resultLabel = t(publicItems.length === 1 ? 'map.results.single' : 'map.results.plural', {
        count: publicItems.length,
    })
    const hasLocationFilter = filterLatitude != null && filterLongitude != null
    const markerDetails = {}

    publicItems.forEach((post) => {
        const ownerProfile = ownerProfiles[post.userId] ?? null
        const ownerName = ownerProfile ? `${ownerProfile.firstName} ${ownerProfile.lastName}` : t('common.neighbor')

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
        dispatch(mapViewportChanged({center: [Number(post.latitude), Number(post.longitude)], zoom: 15}))
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
        dispatch(mapViewportChanged({center: [nextPosition.latitude, nextPosition.longitude], zoom: 13}))
    }

    const handleToggleDirections = async () => {
        if (!selectedPost || directionsStatus === 'loading') {
            return
        }

        if (directionsStatus === 'ready') {
            setDirectionsState(createIdleDirectionsState())
            return
        }

        const origin = locationStatus === 'ready' ? position : await requestLocation()

        if (!origin) {
            setDirectionsState({
                coordinates: [],
                error: t('postDetail.routeLocationRequired'),
                postId: selectedPost.id,
                status: 'error',
                summary: null,
            })
            return
        }

        setDirectionsState({
            coordinates: [],
            error: null,
            postId: selectedPost.id,
            status: 'loading',
            summary: null,
        })

        try {
            const nextRoute = await fetchDirectionsRoute(origin, {
                latitude: Number(selectedPost.latitude),
                longitude: Number(selectedPost.longitude),
            })

            setDirectionsState({
                coordinates: nextRoute.coordinates,
                error: null,
                postId: selectedPost.id,
                status: 'ready',
                summary: {
                    distanceKm: nextRoute.distanceKm,
                    durationMinutes: nextRoute.durationMinutes,
                },
            })
        } catch {
            setDirectionsState({
                coordinates: [],
                error: t('map.route.error'),
                postId: selectedPost.id,
                status: 'error',
                summary: null,
            })
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.mapStage}>
                <div className={styles.mapLayer}>
                    <PostMap
                        markers={markers}
                        center={center}
                        mapMode={mapMode}
                        markerDetails={markerDetails}
                        routeCoordinates={directionsCoordinates}
                        routeError={directionsError}
                        routeStatus={directionsStatus}
                        routeSummary={directionsSummary}
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
                    <div className={styles.searchStack}>
                        <SpotlightSearch
                            label={t('search.mapLabel')}
                            onChange={(keyword) => dispatch(postFiltersChanged({keyword}))}
                            onClear={() => dispatch(postFiltersChanged({keyword: ''}))}
                            placeholder={t('search.mapPlaceholder')}
                            value={filters.keyword}
                        />

                        <div className={styles.modeToggle} role="group" aria-label={t('map.viewMode')}>
                            <button
                                type="button"
                                className={mapMode === '2d' ? `${styles.modeButton} ${styles.modeButtonActive}` : styles.modeButton}
                                onClick={() => setMapMode('2d')}
                            >
                                {t('map.view2d')}
                            </button>
                            <button
                                type="button"
                                className={mapMode === '3d' ? `${styles.modeButton} ${styles.modeButtonActive}` : styles.modeButton}
                                onClick={() => setMapMode('3d')}
                            >
                                {t('map.view3d')}
                            </button>
                        </div>
                    </div>
                </div>

                <div className={styles.mapLegend}>
                    <span className={styles.requestChip}>{t('map.legend.requests', {count: requestCount})}</span>
                    <span className={styles.offerChip}>{t('map.legend.offers', {count: offerCount})}</span>
                    <span className={styles.metaChip}>
            {locationStatus === 'ready' ? t('map.legend.currentPosition') : t('map.legend.publicView')}
          </span>
                </div>
            </div>

            <aside className={styles.sidebar}>
                <div className={styles.sidebarPanel}>
                    <div className={styles.sidebarHeader}>
                        <p className={styles.eyebrow}>{t('map.sidebar.eyebrow')}</p>
                        <h1>{t('map.sidebar.title')}</h1>
                        <p>
                            {t('map.sidebar.description')}
                        </p>
                    </div>

                    <div className={styles.actionRow}>
                        {currentUser ? (
                            <>
                                <Link className={styles.primaryAction} to="/posts/new">
                                    {t('common.actions.createPost')}
                                </Link>
                                <Link className={styles.secondaryAction} to="/posts">
                                    {t('common.actions.manageMine')}
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link className={styles.primaryAction} to="/register">
                                    {t('common.actions.joinNow')}
                                </Link>
                                <Link className={styles.secondaryAction} to="/login">
                                    {t('common.actions.signIn')}
                                </Link>
                            </>
                        )}
                    </div>

                    <section className={styles.filtersPanel}>
                        <div className={styles.sectionHeader}>
                            <div>
                                <p className={styles.sectionLabel}>{t('map.filters.label')}</p>
                                <h2>{t('map.filters.title')}</h2>
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
                                {t('common.actions.reset')}
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
                            <p className={styles.sectionLabel}>{t('map.focusedPin')}</p>
                            <h2>{selectedPost.title}</h2>
                            <p>{selectedPost.description}</p>
                            <div className={styles.focusMeta}>
                                <span>{selectedOwner ? `${selectedOwner.firstName} ${selectedOwner.lastName}` : t('common.neighbor')}</span>
                                {markerDetails[selectedPost.id]?.distanceKm !== null ? (
                                    <span>{t('common.distanceAway', {distance: markerDetails[selectedPost.id].distanceKm.toFixed(1)})}</span>
                                ) : null}
                            </div>
                            <div className={styles.actionRow}>
                                <Link className={styles.primaryAction} to={`/posts/${selectedPost.id}`}>
                                    {t('common.actions.openDetails')}
                                </Link>
                                <button
                                    className={styles.secondaryAction}
                                    type="button"
                                    disabled={directionsStatus === 'loading'}
                                    onClick={handleToggleDirections}
                                >
                                    {directionsStatus === 'loading'
                                        ? t('common.loading')
                                        : directionsStatus === 'ready'
                                            ? t('common.actions.hideDirections')
                                            : t('common.actions.getDirections')}
                                </button>
                                {selectedOwner ? (
                                    <Link className={styles.secondaryAction} to={`/profiles/${selectedOwner.id}`}>
                                        {t('common.actions.viewProfile')}
                                    </Link>
                                ) : null}
                            </div>
                        </section>
                    ) : null}

                    <section className={styles.resultsPanel}>
                        <div className={styles.listHeader}>
                            <div className={styles.listTitleBlock}>
                                <div className={styles.listTitleRow}>
                                    <p className={styles.sectionLabel}>{t('map.postsLabel')}</p>
                                    <span className={styles.resultBadge}>{resultLabel}</span>
                                </div>
                                <h2>{t('map.matchesTitle')}</h2>
                            </div>
                            <p className={styles.listMeta}>
                                {hasLocationFilter
                                    ? t('map.radiusAroundChosenLocation', {radius: filters.radiusKm || t('common.any')})
                                    : t('map.publicBoard')}
                            </p>
                        </div>

                        {error ? <p className={styles.error}>{error}</p> : null}

                        <div className={styles.listArea}>
                            {browseStatus === 'loading' ? (
                                <p className={styles.loading}>{t('map.loadingPosts')}</p>
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
                                    title={t('map.noMatches.title')}
                                    description={t('map.noMatches.description')}
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
