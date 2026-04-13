export function openDirections(destination, origin = null) {
  if (!destination) {
    return
  }

  const destinationParam = `${destination.latitude},${destination.longitude}`
  const originParam = origin ? `&origin=${origin.latitude},${origin.longitude}` : ''
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destinationParam}${originParam}`

  window.open(directionsUrl, '_blank', 'noopener,noreferrer')
}

