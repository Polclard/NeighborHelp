import { useRoutes } from 'react-router-dom'
import AppShell from '../components/layout/AppShell.jsx'
import FeaturePlaceholderPage from '../pages/FeaturePlaceholderPage.jsx'
import HomePage from '../pages/HomePage.jsx'
import NotFoundPage from '../pages/NotFoundPage.jsx'

const routes = [
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'login',
        element: (
          <FeaturePlaceholderPage
            eyebrow="Auth"
            title="Login Flow"
            description="Shared shell, router, store, and API plumbing are ready. The next slice will connect this page to the backend auth endpoints and cookie refresh flow."
            checkpoints={[
              'React Hook Form + Yup form wiring',
              'Auth slice thunks for login/logout/session restore',
              'Axios refresh retry behavior',
            ]}
          />
        ),
      },
      {
        path: 'register',
        element: (
          <FeaturePlaceholderPage
            eyebrow="Auth"
            title="Registration Flow"
            description="This route is reserved for the full account creation experience, using the existing backend registration contract and validation messages."
            checkpoints={[
              'Registration form schema and field components',
              'Backend validation error mapping',
              'Immediate session bootstrap after successful sign-up',
            ]}
          />
        ),
      },
      {
        path: 'map',
        element: (
          <FeaturePlaceholderPage
            eyebrow="Discovery"
            title="Map Workspace"
            description="Leaflet is installed and the shell is prepared for the main discovery experience. The real map slice will add filters, hover cards, and route overlays."
            checkpoints={[
              'Post markers from the public posts API',
              'Category and lifecycle filters',
              'Fly-to interactions from search results',
            ]}
          />
        ),
      },
      {
        path: 'posts',
        element: (
          <FeaturePlaceholderPage
            eyebrow="Posts"
            title="Post Detail + CRUD"
            description="The posts slice will sit on top of the shared API client and Redux store already configured in this commit."
            checkpoints={[
              'Public post list and detail pages',
              'Create/edit forms with photo upload',
              'Lifecycle controls for request and offer statuses',
            ]}
          />
        ),
      },
      {
        path: 'chat',
        element: (
          <FeaturePlaceholderPage
            eyebrow="Realtime"
            title="Conversations + Chat"
            description="The STOMP client wrapper is in place. The next chat slice will connect it to the conversations API and live message subscriptions."
            checkpoints={[
              'Conversation list fetch',
              'Chat window state and optimistic message rendering',
              'STOMP subscription lifecycle',
            ]}
          />
        ),
      },
      {
        path: 'profile',
        element: (
          <FeaturePlaceholderPage
            eyebrow="Profile"
            title="Profile Workspace"
            description="The profile slice will use the shared store and API client to drive profile editing, avatar uploads, and review history."
            checkpoints={[
              'Own profile fetch + edit',
              'Avatar upload flow',
              'Public profile and reviews view',
            ]}
          />
        ),
      },
      {
        path: 'admin',
        element: (
          <FeaturePlaceholderPage
            eyebrow="Admin"
            title="Admin Control Room"
            description="The backend admin endpoints are already tested. The frontend shell now reserves a route for moderation dashboards and review queues."
            checkpoints={[
              'Dashboard metrics cards',
              'User moderation tables',
              'Report review queue',
            ]}
          />
        ),
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]

export function AppRouter() {
  return useRoutes(routes)
}
