import {useEffect} from 'react'
import {Link} from 'react-router-dom'
import {CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap, useMapEvents, ZoomControl} from 'react-leaflet'
import {defaultMapCenter} from '../../constants/map.js'
import {formatPostStatus, formatPostType} from '../../constants/posts.js'
import styles from './PostMap.module.css'

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
                 }) {
    const frameClassName = variant === 'immersive' ? `${styles.frame} ${styles.frameImmersive}` : styles.frame
    const mapClassName = variant === 'immersive' ? `${styles.map} ${styles.mapImmersive}` : styles.map

    return (
        <div className={frameClassName}>
            <MapContainer center={center} zoom={zoom} className={mapClassName} scrollWheelZoom preferCanvas
                          zoomControl={false}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ZoomControl position={variant === 'immersive' ? 'bottomright' : 'topright'}/>

                <MapViewportSync center={center} zoom={zoom}/>
                <MapClickHandler onMapPick={onMapPick}/>

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
                        <Tooltip>Your position</Tooltip>
                    </CircleMarker>
                ) : null}

                {markers.map((marker) => {
                    const isOffer = marker.postType === 'SERVICE_OFFER'
                    const isSelected = marker.id === selectedMarkerId
                    const centerPoint = [Number(marker.latitude), Number(marker.longitude)]
                    const detail = markerDetails[marker.id] ?? null
                    const hasInteractivePopup = variant === 'immersive' && Boolean(detail)

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
                                color: isOffer ? '#1f6f57' : '#d7662f',
                                fillColor: isOffer ? '#7fd7b9' : '#ffd7b5',
                                fillOpacity: isSelected ? 1 : 0.92,
                                weight: isSelected ? 3 : 2,
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
                                    {formatPostType(marker.postType)} · {formatPostStatus(marker.status)}
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
                            Selected location
                            <br/>
                            {Number(selection.latitude).toFixed(5)}, {Number(selection.longitude).toFixed(5)}
                        </Popup>
                    </CircleMarker>
                ) : null}
            </MapContainer>
        </div>
    )
}

function MapViewportSync({center, zoom}) {
    const map = useMap()

    useEffect(() => {
        if (!center) {
            return
        }

        const nextCenter = [center[0], center[1]]
        const currentCenter = map.getCenter()

        if (
            currentCenter.lat !== nextCenter[0] ||
            currentCenter.lng !== nextCenter[1] ||
            map.getZoom() !== zoom
        ) {
            map.flyTo(nextCenter, zoom, {duration: 0.6})
        }
    }, [center, map, zoom])

    return null
}

function MarkerInfoCard({detail, marker}) {
    const avatarStyle = detail.ownerAvatar ? {backgroundImage: `url("${detail.ownerAvatar}")`} : undefined

    return (
        <div className={styles.infoCard}>
            <div className={styles.infoBadges}>
        <span className={marker.postType === 'SERVICE_OFFER' ? styles.offerBadge : styles.requestBadge}>
          {formatPostType(marker.postType)}
        </span>
                <span className={styles.statusBadge}>{formatPostStatus(marker.status)}</span>
            </div>

            <h3>{marker.title}</h3>
            <p>{detail.description || marker.category}</p>

            <div className={styles.infoOwner}>
        <span className={styles.infoAvatar} style={avatarStyle}>
          {!detail.ownerAvatar ? detail.ownerName.charAt(0) : null}
        </span>
                <div>
                    <p className={styles.infoOwnerName}>{detail.ownerName}</p>
                    <p className={styles.infoOwnerMeta}>
                        {detail.distanceKm !== null ? `${detail.distanceKm.toFixed(1)} km away` : marker.category}
                    </p>
                </div>
            </div>

            <Link className={styles.infoAction} to={`/posts/${marker.id}`}>
                View details
            </Link>
        </div>
    )
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
