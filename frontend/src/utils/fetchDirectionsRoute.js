export async function fetchDirectionsRoute(origin, destination) {
  if (!origin || !destination) {
    throw new Error('Route origin and destination are required')
  }

  const originLatitude = Number(origin.latitude)
  const originLongitude = Number(origin.longitude)
  const destinationLatitude = Number(destination.latitude)
  const destinationLongitude = Number(destination.longitude)
  const query = new URLSearchParams({
    geometries: 'geojson',
    overview: 'full',
  })
  const routeUrl = `https://router.project-osrm.org/route/v1/driving/${originLongitude},${originLatitude};${destinationLongitude},${destinationLatitude}?${query.toString()}`
  const response = await fetch(routeUrl)

  if (!response.ok) {
    throw new Error(`Directions request failed with status ${response.status}`)
  }

  const payload = await response.json()
  const route = payload.routes?.[0]

  if (!route?.geometry?.coordinates?.length) {
    throw new Error('Directions geometry was not returned')
  }

  return {
    coordinates: route.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude]),
    distanceKm: route.distance / 1000,
    durationMinutes: Math.max(1, Math.round(route.duration / 60)),
  }
}
