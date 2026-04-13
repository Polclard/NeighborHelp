const EARTH_RADIUS_KM = 6371

export function calculateDistanceKm(origin, destination) {
  if (!origin || !destination) {
    return null
  }

  const latDistance = toRadians(destination.latitude - origin.latitude)
  const lonDistance = toRadians(destination.longitude - origin.longitude)
  const startLat = toRadians(origin.latitude)
  const endLat = toRadians(destination.latitude)

  const a =
    Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_KM * c
}

function toRadians(value) {
  return (value * Math.PI) / 180
}

