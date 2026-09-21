import {useEffect} from 'react'
import {Link} from 'react-router-dom'
import {
    AttributionControl,
    CircleMarker,
    MapContainer,
    Polyline,
    Popup,
    TileLayer,
    Tooltip,
    useMap,
    useMapEvents,
    ZoomControl
} from 'react-leaflet'
import {defaultMapCenter, mapTileSources} from '../../constants/map.js'
import {formatPostStatus, formatPostType, mapPreviewDescriptionLength} from '../../constants/posts.js'
import {useI18n} from '../../i18n/useI18n.js'
import OpenFreeMapScene from './OpenFreeMapScene.jsx'
import styles from './PostMap.module.css'
import {truncateText} from '../../utils/truncateText.js'

function PostMap({
                     markers = [],
                     selection = null,
                     center = defaultMapCenter,
                     zoom = 13,
                     onMarkerSelect = null,
                     onMapPick = null,
                     markerDetails = {},
                     selectedMarkerId = null,
                     viewerPosition = null,
                     variant = 'default',
                     mapMode = '2d',
                     routeCoordinates = [],
                     routeError = null,
                     routeStatus = 'idle',
                     routeSummary = null,
                 }) {
    const {t} = useI18n()
    const frameClassName = variant === 'immersive' ? `${styles.frame} ${styles.frameImmersive}` : styles.frame

    return (
        <div className={frameClassName}>
            {mapMode === '3d' ? (
                <OpenFreeMapScene
                    center={center}
                    markerDetails={markerDetails}
                    markers={markers}
                    onMapPick={onMapPick}
                    onMarkerSelect={onMarkerSelect}
                    routeCoordinates={routeCoordinates}
                    selectedMarkerId={selectedMarkerId}
                    selection={selection}
                    variant={variant}
                    viewerPosition={viewerPosition}
                    zoom={zoom}
                />
            ) : (
                <LeafletPostMap
                    center={center}
                    markerDetails={markerDetails}
                    markers={markers}
                    onMapPick={onMapPick}
                    onMarkerSelect={onMarkerSelect}
                    routeCoordinates={routeCoordinates}
                    selectedMarkerId={selectedMarkerId}
                    selection={selection}
                    variant={variant}
                    viewerPosition={viewerPosition}
                    zoom={zoom}
                />
            )}

            {routeStatus !== 'idle' ? (
                <div className={styles.routePanel} aria-live="polite">
                    {routeStatus === 'loading' ? <p className={styles.routeMessage}>{t('map.route.loading')}</p> : null}
                    {routeSummary ? (
                        <p className={styles.routeSummary}>
                            {t('map.route.summary', {
                                distance: routeSummary.distanceKm.toFixed(1),
                                minutes: routeSummary.durationMinutes,
                            })}
                        </p>
                    ) : null}
                    {routeStatus === 'error' ? (
                        <p className={`${styles.routeMessage} ${styles.routeError}`}>
                            {routeError || t('map.route.error')}
                        </p>
                    ) : null}
                </div>
            ) : null}
        </div>
    )
}

function LeafletPostMap({
                            markers = [],
                            selection = null,
                            center = defaultMapCenter,
                            zoom = 13,
                            onMarkerSelect = null,
                            onMapPick = null,
                            markerDetails = {},
                            selectedMarkerId = null,
                            viewerPosition = null,
                            variant = 'default',
                            routeCoordinates = [],
                        }) {
    const {t} = useI18n()
    const tileSource = mapTileSources['2d']
    const mapClassName = [
        styles.map,
        variant === 'immersive' ? styles.mapImmersive : '',
    ]
        .filter(Boolean)
        .join(' ')

    return (
        <MapContainer center={center} zoom={zoom} className={mapClassName} scrollWheelZoom preferCanvas
                      zoomControl={false} attributionControl={false}>
            <TileLayer
                attribution={tileSource.attribution}
                detectRetina={tileSource.detectRetina}
                maxZoom={tileSource.maxZoom}
                subdomains={tileSource.subdomains}
                url={tileSource.url}
            />
            <ZoomControl position="topleft"/>
            <AttributionControl position="topleft"/>

            <MapViewportSync center={center} routeCoordinatesLength={routeCoordinates.length} zoom={zoom}/>
            <MapClickHandler onMapPick={onMapPick}/>
            <RouteViewportSync routeCoordinates={routeCoordinates}/>

            {viewerPosition ? (
                <CircleMarker
                    center={[viewerPosition.latitude, viewerPosition.longitude]}
                    radius={9}
                    pathOptions={{
                        color: '#124b7a',
                        fillColor: '#4aa6ff',
                        fillOpacity: 0.85,
                        weight: 2,
                    }}
                >
                    <Tooltip>{t('postMap.yourPosition')}</Tooltip>
                </CircleMarker>
            ) : null}

            {routeCoordinates.length ? (
                <Polyline
                    pathOptions={{
                        color: '#1455a0',
                        lineCap: 'round',
                        lineJoin: 'round',
                        opacity: 0.94,
                        weight: 6,
                    }}
                    positions={routeCoordinates}
                />
            ) : null}

            {markers.map((marker) => {
                const isSelected = marker.id === selectedMarkerId
                const centerPoint = [Number(marker.latitude), Number(marker.longitude)]
                const detail = markerDetails[marker.id] ?? null
                const hasInteractivePopup = variant === 'immersive' && Boolean(detail)
                const palette = resolveMarkerPalette(marker, isSelected)

                return (
                    <CircleMarker
                        key={marker.id}
                        center={centerPoint}
                        radius={isSelected ? 14 : 12}
                        eventHandlers={
                            onMarkerSelect
                                ? {
                                    click: () => onMarkerSelect(marker.id),
                                }
                                : undefined
                        }
                        pathOptions={{
                            color: palette.color,
                            fillColor: palette.fillColor,
                            fillOpacity: palette.fillOpacity,
                            weight: palette.weight,
                        }}
                    >
                        <Tooltip
                            direction="top"
                            offset={[0, -8]}
                            sticky
                            opacity={1}
                            className={styles.plainTooltip}
                        >
                            {marker.title}
                        </Tooltip>

                        {hasInteractivePopup ? (
                            <Popup className={styles.richPopup} closeButton={false} autoPan>
                                <MarkerInfoCard detail={detail} marker={marker}/>
                            </Popup>
                        ) : variant !== 'immersive' ? (
                            <Popup>
                                <strong>{marker.title}</strong>
                                <br/>
                                {formatPostType(marker.postType, t)} · {formatPostStatus(marker.status, t)}
                                <br/>
                                {marker.category}
                            </Popup>
                        ) : null}
                    </CircleMarker>
                )
            })}

            {selection ? (
                <CircleMarker
                    center={[selection.latitude, selection.longitude]}
                    radius={10}
                    pathOptions={{
                        color: '#124b7a',
                        fillColor: '#4aa6ff',
                        fillOpacity: 0.92,
                        weight: 2,
                    }}
                >
                    <Popup>
                        {t('postMap.selectedLocation')}
                        <br/>
                        {Number(selection.latitude).toFixed(5)}, {Number(selection.longitude).toFixed(5)}
                    </Popup>
                </CircleMarker>
            ) : null}
        </MapContainer>
    )
}

function MapViewportSync({center, routeCoordinatesLength = 0, zoom}) {
    const map = useMap()
    const centerLatitude = center?.[0] ?? null
    const centerLongitude = center?.[1] ?? null

    useEffect(() => {
        if (centerLatitude == null || centerLongitude == null) {
            return
        }

        if (routeCoordinatesLength > 1) {
            return
        }

        const nextCenter = [centerLatitude, centerLongitude]
        const currentCenter = map.getCenter()

        if (
            currentCenter.lat !== nextCenter[0] ||
            currentCenter.lng !== nextCenter[1] ||
            map.getZoom() !== zoom
        ) {
            map.flyTo(nextCenter, zoom, {duration: 0.6})
        }
    }, [centerLatitude, centerLongitude, map, routeCoordinatesLength, zoom])

    return null
}

function RouteViewportSync({routeCoordinates}) {
    const map = useMap()

    useEffect(() => {
        if (routeCoordinates.length < 2) {
            return
        }

        map.fitBounds(routeCoordinates, {
            maxZoom: 15,
            padding: [44, 44],
        })
    }, [map, routeCoordinates])

    return null
}

function MarkerInfoCard({detail, marker}) {
    const {t} = useI18n()
    const avatarStyle = detail.ownerAvatar ? {backgroundImage: `url("${detail.ownerAvatar}")`} : undefined

    return (
        <div className={styles.infoCard}>
            <div className={styles.infoBadges}>
        <span className={marker.postType === 'SERVICE_OFFER' ? styles.offerBadge : styles.requestBadge}>
          {formatPostType(marker.postType, t)}
        </span>
                <span className={styles.statusBadge}>{formatPostStatus(marker.status, t)}</span>
            </div>

            <h3>{marker.title}</h3>
            <p className={styles.infoDescription}>{truncateText(detail?.description, mapPreviewDescriptionLength) || marker.category}</p>

            <div className={styles.infoOwner}>
        <span className={styles.infoAvatar} style={avatarStyle}>
          {!detail.ownerAvatar ? detail.ownerName.charAt(0) : null}
        </span>
                <div>
                    <p className={styles.infoOwnerName}>{detail.ownerName}</p>
                    <p className={styles.infoOwnerMeta}>
                        {detail.distanceKm !== null ? t('common.distanceAway', {distance: detail.distanceKm.toFixed(1)}) : marker.category}
                    </p>
                </div>
            </div>

            <Link className={styles.infoAction} to={`/posts/${marker.id}`}>
                {t('common.actions.viewDetails')}
            </Link>
        </div>
    )
}

function resolveMarkerPalette(marker, isSelected) {
    if (marker.status === 'SERVICE_DONE') {
        return {
            color: '#64706f',
            fillColor: '#aab3b2',
            fillOpacity: isSelected ? 0.88 : 0.56,
            weight: isSelected ? 3 : 2,
        }
    }

    if (marker.postType === 'SERVICE_OFFER') {
        return {
            color: '#1f6f57',
            fillColor: '#7fd7b9',
            fillOpacity: isSelected ? 1 : 0.92,
            weight: isSelected ? 3 : 2,
        }
    }

    return {
        color: '#d7662f',
        fillColor: '#ffd7b5',
        fillOpacity: isSelected ? 1 : 0.92,
        weight: isSelected ? 3 : 2,
    }
}

function MapClickHandler({onMapPick}) {
    useMapEvents({
        click(event) {
            if (onMapPick) {
                onMapPick({
                    latitude: Number(event.latlng.lat.toFixed(6)),
                    longitude: Number(event.latlng.lng.toFixed(6)),
                })
            }
        },
    })

    return null
}

export default PostMap
