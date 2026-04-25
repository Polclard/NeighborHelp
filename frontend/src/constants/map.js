export const defaultMapCenter = [41.9981, 21.4254]

export const mapTileSources = {
  '2d': {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    detectRetina: true,
    maxZoom: 19,
    subdomains: 'abc',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  },
}

export const openFreeMapStyleUrl = 'https://tiles.openfreemap.org/styles/liberty'

export const openFreeMapThreeDView = {
  bearing: 55.2,
  pitch: 60,
}

export const mapPreviewMarkers = [
  {
    id: 'marker-1',
    position: [41.9981, 21.4254],
    title: 'Groceries for an elderly neighbor',
    type: 'SERVICE_REQUEST',
  },
  {
    id: 'marker-2',
    position: [42.0004, 21.4333],
    title: 'Weekend plumbing help available',
    type: 'SERVICE_OFFER',
  },
  {
    id: 'marker-3',
    position: [41.9948, 21.4172],
    title: 'Need someone to carry boxes',
    type: 'SERVICE_REQUEST',
  },
]
