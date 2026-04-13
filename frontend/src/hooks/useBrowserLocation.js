import { useEffect, useState } from 'react'
import { defaultMapCenter } from '../constants/map.js'

const fallbackPosition = {
  latitude: defaultMapCenter[0],
  longitude: defaultMapCenter[1],
}

export function useBrowserLocation(autoRequest = false) {
  const [position, setPosition] = useState(fallbackPosition)
  const [status, setStatus] = useState(autoRequest ? 'loading' : 'idle')
  const [error, setError] = useState(null)

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setStatus('error')
      setError('Browser geolocation is not available')
      return Promise.resolve(null)
    }

    setStatus('loading')
    setError(null)

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (result) => {
          const nextPosition = {
            latitude: result.coords.latitude,
            longitude: result.coords.longitude,
          }

          setPosition(nextPosition)
          setStatus('ready')
          resolve(nextPosition)
        },
        () => {
          setStatus('error')
          setError('Location permission was denied')
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
        },
      )
    })
  }

  useEffect(() => {
    if (!autoRequest) {
      return
    }

    if (!navigator.geolocation) {
      queueMicrotask(() => {
        setStatus('error')
        setError('Browser geolocation is not available')
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (result) => {
        setPosition({
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
        })
        setStatus('ready')
      },
      () => {
        setStatus('error')
        setError('Location permission was denied')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    )
  }, [autoRequest])

  return {
    position,
    status,
    error,
    requestLocation,
  }
}
