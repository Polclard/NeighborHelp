import { Link } from 'react-router-dom'
import MetricCard from '../components/ui/MetricCard.jsx'
import SurfaceCard from '../components/ui/SurfaceCard.jsx'
import styles from './HomePage.module.css'

const slices = [
  { title: 'Discovery', status: 'Live', detail: 'Public map browsing now uses the real posts and markers endpoints.' },
  { title: 'Posts', status: 'Live', detail: 'Create, edit, detail, photo upload, and status transitions are wired.' },
  { title: 'Profiles + Chat', status: 'Live', detail: 'Profile editing, public reviews, conversations, and STOMP chat all have UI.' },
]

const milestones = [
  'Map filters update both markers and list cards',
  'Create and edit forms share the same post form component',
  'Public and private profiles are backed by the live backend API',
  'Admin moderation tables now work behind the protected admin route',
]

function HomePage() {
  return (
    <div className={styles.page}>
      <SurfaceCard
        className={styles.hero}
        eyebrow="NeighborHelp"
        title="The frontend is now an actual product surface, not a scaffold."
        description="You can browse the map, manage posts, update profiles, message other users in realtime, and moderate content from the admin area."
        actions={
          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} to="/map">
              Open map
            </Link>
            <Link className={styles.secondaryAction} to="/posts">
              Manage posts
            </Link>
          </div>
        }
      >
        <div className={styles.heroCopy}>
          <ul className={styles.milestoneList}>
            {milestones.map((milestone) => (
              <li key={milestone}>{milestone}</li>
            ))}
          </ul>
        </div>

        <div className={styles.statPanel}>
          {slices.map((slice) => (
            <MetricCard key={slice.title} caption={slice.detail} label={slice.status} value={slice.title} />
          ))}
        </div>
      </SurfaceCard>
    </div>
  )
}

export default HomePage
