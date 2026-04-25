import {useEffect, useMemo, useRef, useState} from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {defaultMapCenter, openFreeMapStyleUrl, openFreeMapThreeDView} from '../../constants/map.js'
import {formatPostStatus, formatPostType} from '../../constants/posts.js'
import {useI18n} from '../../i18n/useI18n.js'
import styles from './PostMap.module.css'

const POST_SOURCE_ID = 'post-markers'
const POST_LAYER_ID = 'post-markers-layer'
const ROUTE_SOURCE_ID = 'route-line'
const ROUTE_LAYER_ID = 'route-line-layer'
const VIEWER_SOURCE_ID = 'viewer-position'
const VIEWER_LAYER_ID = 'viewer-position-layer'
const SELECTION_SOURCE_ID = 'selection-position'
const SELECTION_LAYER_ID = 'selection-position-layer'

function OpenFreeMapScene({
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
    const containerRef = useRef(null)
    const mapRef = useRef(null)
    const popupRef = useRef(null)
    const onMapPickRef = useRef(onMapPick)
    const onMarkerSelectRef = useRef(onMarkerSelect)
    const popupActionLabelRef = useRef(t('common.actions.viewDetails'))
    const initialCenterRef = useRef(center)
    const initialZoomRef = useRef(zoom)
    const [mapReady, setMapReady] = useState(false)
    const mapClassName = [
        styles.map,
        styles.mapThreeDimensional,
        variant === 'immersive' ? styles.mapImmersive : '',
    ]
        .filter(Boolean)
        .join(' ')
    const controlPosition = 'top-left'

    useEffect(() => {
        onMapPickRef.current = onMapPick
    }, [onMapPick])

    useEffect(() => {
        onMarkerSelectRef.current = onMarkerSelect
    }, [onMarkerSelect])

    useEffect(() => {
        popupActionLabelRef.current = t('common.actions.viewDetails')
    }, [t])

    const markerFeatures = useMemo(
        () => ({
            type: 'FeatureCollection',
            features: markers.map((marker) => {
                const detail = markerDetails[marker.id] ?? null
                const ownerName = detail?.ownerName || t('common.neighbor')
                const metaText =
                    detail?.distanceKm !== null && detail?.distanceKm !== undefined
                        ? t('common.distanceAway', {distance: detail.distanceKm.toFixed(1)})
                        : marker.category

                return {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [Number(marker.longitude), Number(marker.latitude)],
                    },
                    id: marker.id,
                    properties: {
                        category: marker.category || '',
                        detailText: detail?.description || marker.category || '',
                        id: marker.id,
                        metaText,
                        ownerAvatar: detail?.ownerAvatar || '',
                        ownerName,
                        postType: marker.postType,
                        postTypeLabel: formatPostType(marker.postType, t),
                        selected: marker.id === selectedMarkerId,
                        status: marker.status,
                        statusLabel: formatPostStatus(marker.status, t),
                        title: marker.title,
                    },
                }
            }),
        }),
        [markerDetails, markers, selectedMarkerId, t],
    )

    const routeFeature = useMemo(
        () => ({
            type: 'FeatureCollection',
            features:
                routeCoordinates.length > 1
                    ? [
                        {
                            type: 'Feature',
                            geometry: {
                                type: 'LineString',
                                coordinates: routeCoordinates.map(([latitude, longitude]) => [longitude, latitude]),
                            },
                            properties: {},
                        },
                    ]
                    : [],
        }),
        [routeCoordinates],
    )

    const viewerFeature = useMemo(
        () => createPointFeatureCollection(viewerPosition),
        [viewerPosition],
    )

    const selectionFeature = useMemo(
        () => createPointFeatureCollection(selection),
        [selection],
    )

    useEffect(() => {
        if (!containerRef.current || mapRef.current) {
            return
        }

        const map = new maplibregl.Map({
            attributionControl: false,
            bearing: openFreeMapThreeDView.bearing,
            center: toLngLat(initialCenterRef.current),
            container: containerRef.current,
            pitch: openFreeMapThreeDView.pitch,
            style: openFreeMapStyleUrl,
            zoom: initialZoomRef.current,
        })

        mapRef.current = map

        map.addControl(new maplibregl.NavigationControl({showCompass: true, visualizePitch: true}), controlPosition)
        map.addControl(new maplibregl.AttributionControl({compact: false}), 'top-left')

        const resizeObserver = new ResizeObserver(() => {
            map.resize()
        })

        resizeObserver.observe(containerRef.current)

        map.on('load', () => {
            addSourcesAndLayers(map)
            setMapReady(true)
        })

        map.on('mouseenter', POST_LAYER_ID, () => {
            map.getCanvas().style.cursor = 'pointer'
        })

        map.on('mouseleave', POST_LAYER_ID, () => {
            map.getCanvas().style.cursor = ''
        })

        map.on('click', POST_LAYER_ID, (event) => {
            const feature = event.features?.[0]

            if (!feature) {
                return
            }

            const markerId = feature.properties?.id

            if (markerId) {
                onMarkerSelectRef.current?.(markerId)
            }

            popupRef.current?.remove()
            popupRef.current = new maplibregl.Popup({
                closeButton: false,
                closeOnMove: false,
                maxWidth: '320px',
                offset: 18,
                className: styles.mapLibrePopup,
            })
                .setLngLat(event.lngLat)
                .setDOMContent(buildPopupContent(feature.properties, popupActionLabelRef.current))
                .addTo(map)
        })

        map.on('click', (event) => {
            if (!onMapPickRef.current) {
                return
            }

            const features = map.queryRenderedFeatures(event.point, {layers: [POST_LAYER_ID]})

            if (features.length) {
                return
            }

            onMapPickRef.current({
                latitude: Number(event.lngLat.lat.toFixed(6)),
                longitude: Number(event.lngLat.lng.toFixed(6)),
            })
        })

        return () => {
            resizeObserver.disconnect()
            popupRef.current?.remove()
            popupRef.current = null
            map.remove()
            mapRef.current = null
            setMapReady(false)
        }
    }, [controlPosition])

    useEffect(() => {
        if (!mapReady || !mapRef.current) {
            return
        }

        setSourceData(mapRef.current, POST_SOURCE_ID, markerFeatures)
        setSourceData(mapRef.current, ROUTE_SOURCE_ID, routeFeature)
        setSourceData(mapRef.current, VIEWER_SOURCE_ID, viewerFeature)
        setSourceData(mapRef.current, SELECTION_SOURCE_ID, selectionFeature)
    }, [mapReady, markerFeatures, routeFeature, selectionFeature, viewerFeature])

    useEffect(() => {
        if (!mapReady || !mapRef.current) {
            return
        }

        const map = mapRef.current

        if (routeCoordinates.length > 1) {
            map.fitBounds(buildBounds(routeCoordinates), {
                bearing: openFreeMapThreeDView.bearing,
                duration: 700,
                maxZoom: 15,
                padding: 44,
                pitch: openFreeMapThreeDView.pitch,
            })
            return
        }

        const nextCenter = toLngLat(center)
        const currentCenter = map.getCenter()

        if (
            currentCenter.lng !== nextCenter[0] ||
            currentCenter.lat !== nextCenter[1] ||
            map.getZoom() !== zoom ||
            map.getBearing() !== openFreeMapThreeDView.bearing ||
            map.getPitch() !== openFreeMapThreeDView.pitch
        ) {
            map.easeTo({
                bearing: openFreeMapThreeDView.bearing,
                center: nextCenter,
                duration: 700,
                pitch: openFreeMapThreeDView.pitch,
                zoom,
            })
        }
    }, [center, mapReady, routeCoordinates, zoom])

    return <div ref={containerRef} className={mapClassName}/>
}

function addSourcesAndLayers(map) {
    map.addSource(POST_SOURCE_ID, {
        data: emptyFeatureCollection(),
        type: 'geojson',
    })

    map.addSource(ROUTE_SOURCE_ID, {
        data: emptyFeatureCollection(),
        type: 'geojson',
    })

    map.addSource(VIEWER_SOURCE_ID, {
        data: emptyFeatureCollection(),
        type: 'geojson',
    })

    map.addSource(SELECTION_SOURCE_ID, {
        data: emptyFeatureCollection(),
        type: 'geojson',
    })

    map.addLayer({
        id: ROUTE_LAYER_ID,
        source: ROUTE_SOURCE_ID,
        type: 'line',
        layout: {
            'line-cap': 'round',
            'line-join': 'round',
        },
        paint: {
            'line-color': '#1455a0',
            'line-opacity': 0.94,
            'line-width': 6,
        },
    })

    map.addLayer({
        id: VIEWER_LAYER_ID,
        source: VIEWER_SOURCE_ID,
        type: 'circle',
        paint: {
            'circle-color': '#4aa6ff',
            'circle-opacity': 0.9,
            'circle-radius': 9,
            'circle-stroke-color': '#124b7a',
            'circle-stroke-width': 2,
        },
    })

    map.addLayer({
        id: SELECTION_LAYER_ID,
        source: SELECTION_SOURCE_ID,
        type: 'circle',
        paint: {
            'circle-color': '#4aa6ff',
            'circle-opacity': 0.92,
            'circle-radius': 10,
            'circle-stroke-color': '#124b7a',
            'circle-stroke-width': 2,
        },
    })

    map.addLayer({
        id: POST_LAYER_ID,
        source: POST_SOURCE_ID,
        type: 'circle',
        paint: {
            'circle-color': [
                'case',
                ['==', ['get', 'status'], 'SERVICE_DONE'],
                '#aab3b2',
                ['==', ['get', 'postType'], 'SERVICE_OFFER'],
                '#7fd7b9',
                '#ffd7b5',
            ],
            'circle-opacity': [
                'case',
                ['boolean', ['get', 'selected'], false],
                1,
                ['==', ['get', 'status'], 'SERVICE_DONE'],
                0.56,
                0.92,
            ],
            'circle-radius': [
                'case',
                ['boolean', ['get', 'selected'], false],
                14,
                12,
            ],
            'circle-stroke-color': [
                'case',
                ['==', ['get', 'status'], 'SERVICE_DONE'],
                '#64706f',
                ['==', ['get', 'postType'], 'SERVICE_OFFER'],
                '#1f6f57',
                '#d7662f',
            ],
            'circle-stroke-width': [
                'case',
                ['boolean', ['get', 'selected'], false],
                3,
                2,
            ],
        },
    })
}

function buildPopupContent(properties, actionLabel) {
    const root = document.createElement('div')
    root.className = styles.infoCard

    const badges = document.createElement('div')
    badges.className = styles.infoBadges

    const typeBadge = document.createElement('span')
    typeBadge.className = properties.postType === 'SERVICE_OFFER' ? styles.offerBadge : styles.requestBadge
    typeBadge.textContent = properties.postTypeLabel
    badges.appendChild(typeBadge)

    const statusBadge = document.createElement('span')
    statusBadge.className = styles.statusBadge
    statusBadge.textContent = properties.statusLabel
    badges.appendChild(statusBadge)

    const title = document.createElement('h3')
    title.textContent = properties.title

    const description = document.createElement('p')
    description.textContent = properties.detailText || properties.category

    const owner = document.createElement('div')
    owner.className = styles.infoOwner

    const avatar = document.createElement('span')
    avatar.className = styles.infoAvatar

    if (properties.ownerAvatar) {
        avatar.style.backgroundImage = `url("${properties.ownerAvatar}")`
    } else {
        avatar.textContent = properties.ownerName?.charAt(0) || '?'
    }

    const ownerCopy = document.createElement('div')

    const ownerName = document.createElement('p')
    ownerName.className = styles.infoOwnerName
    ownerName.textContent = properties.ownerName

    const ownerMeta = document.createElement('p')
    ownerMeta.className = styles.infoOwnerMeta
    ownerMeta.textContent = properties.metaText

    ownerCopy.appendChild(ownerName)
    ownerCopy.appendChild(ownerMeta)
    owner.appendChild(avatar)
    owner.appendChild(ownerCopy)

    const link = document.createElement('a')
    link.className = styles.infoAction
    link.href = `/posts/${properties.id}`
    link.textContent = actionLabel

    root.appendChild(badges)
    root.appendChild(title)
    root.appendChild(description)
    root.appendChild(owner)
    root.appendChild(link)

    return root
}

function buildBounds(routeCoordinates) {
    const [[firstLatitude, firstLongitude], ...rest] = routeCoordinates
    const bounds = new maplibregl.LngLatBounds(
        [firstLongitude, firstLatitude],
        [firstLongitude, firstLatitude],
    )

    rest.forEach(([latitude, longitude]) => {
        bounds.extend([longitude, latitude])
    })

    return bounds
}

function createPointFeatureCollection(position) {
    if (!position) {
        return emptyFeatureCollection()
    }

    return {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [Number(position.longitude), Number(position.latitude)],
                },
                properties: {},
            },
        ],
    }
}

function emptyFeatureCollection() {
    return {
        type: 'FeatureCollection',
        features: [],
    }
}

function setSourceData(map, sourceId, data) {
    const source = map.getSource(sourceId)

    if (source) {
        source.setData(data)
    }
}

function toLngLat(center = defaultMapCenter) {
    return [Number(center[1]), Number(center[0])]
}

export default OpenFreeMapScene
