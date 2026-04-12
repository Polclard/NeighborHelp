import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import { API_BASE_URL } from '../constants/env.js'
import { defaultMapCenter, mapPreviewMarkers } from '../constants/map.js'
import { formatCoordinate } from '../utils/formatCoordinate.js'
import styles from './HomePage.module.css'

const slices = [
  { title: 'Auth + Session', status: 'Ready for next slice', detail: 'Router and Axios refresh plumbing are wired.' },
  { title: 'Map + Discovery', status: 'Shell installed', detail: 'Leaflet dependencies and map preview are already live.' },
  { title: 'Realtime Chat', status: 'Client prepared', detail: 'STOMP bootstrap is in place for the next chat slice.' },
]

const milestones = [
  'Shared app shell and route structure',
  'Redux Toolkit root store and feature slices',
  'Environment-driven Axios client with refresh retry path',
  'SockJS + STOMP client wrapper for chat integration',
]

function HomePage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Commit 18 frontend bootstrap</p>
          <h2 className={styles.title}>The frontend now has an actual frame instead of a starter template.</h2>
          <p className={styles.description}>
            This shell is designed around the backend that already exists: auth endpoints, public map posts,
            reviews, admin moderation, and real-time chat. The next slices can focus on behavior instead of setup.
          </p>

          <div className={styles.milestoneCard}>
            <span className={styles.milestoneLabel}>Backend target</span>
            <code className={styles.code}>{API_BASE_URL}</code>
            <ul className={styles.milestoneList}>
              {milestones.map((milestone) => (
                <li key={milestone}>{milestone}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.statPanel}>
          {slices.map((slice) => (
            <article key={slice.title} className={styles.statCard}>
              <p className={styles.statStatus}>{slice.status}</p>
              <h3>{slice.title}</h3>
              <p>{slice.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.mapSection}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionEyebrow}>Map preview</p>
            <h3>Leaflet is already mounted inside the shell.</h3>
          </div>
          <p className={styles.sectionCopy}>
            The real map slice will replace these markers with live data from `/api/posts`, category filters,
            and fly-to interactions.
          </p>
        </div>

        <div className={styles.mapFrame}>
          <MapContainer center={defaultMapCenter} zoom={13} scrollWheelZoom={false} className={styles.map}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {mapPreviewMarkers.map((marker) => (
              <CircleMarker
                key={marker.id}
                center={marker.position}
                radius={12}
                pathOptions={{
                  color: marker.type === 'SERVICE_OFFER' ? '#1f6f57' : '#d7662f',
                  fillColor: marker.type === 'SERVICE_OFFER' ? '#7fd7b9' : '#ffd7b5',
                  fillOpacity: 0.92,
                  weight: 2,
                }}
              >
                <Popup>
                  <strong>{marker.title}</strong>
                  <br />
                  {marker.type}
                  <br />
                  {formatCoordinate(marker.position[0])}, {formatCoordinate(marker.position[1])}
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </section>
    </div>
  )
}

export default HomePage
