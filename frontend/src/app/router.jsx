import {Navigate, useRoutes} from 'react-router-dom'
import ProtectedRoute from '../components/auth/ProtectedRoute.jsx'
import AppShell from '../components/layout/AppShell.jsx'
import AdminPage from '../pages/AdminPage.jsx'
import ChatPage from '../pages/ChatPage.jsx'
import LoginPage from '../pages/LoginPage.jsx'
import MapPage from '../pages/MapPage.jsx'
import NotFoundPage from '../pages/NotFoundPage.jsx'
import PostDetailPage from '../pages/PostDetailPage.jsx'
import PostEditorPage from '../pages/PostEditorPage.jsx'
import PostsPage from '../pages/PostsPage.jsx'
import ProfilePage from '../pages/ProfilePage.jsx'
import PublicProfilePage from '../pages/PublicProfilePage.jsx'
import RegisterPage from '../pages/RegisterPage.jsx'

const routes = [
    {
        path: '/',
        element: <AppShell/>,
        children: [
            {index: true, element: <Navigate to="/map" replace/>},
            {path: 'login', element: <LoginPage/>},
            {path: 'register', element: <RegisterPage/>},
            {path: 'map', element: <MapPage/>},
            {path: 'posts/:postId', element: <PostDetailPage/>},
            {path: 'profiles/:userId', element: <PublicProfilePage/>},

            {
                element: <ProtectedRoute/>,
                children: [
                    {path: 'posts', element: <PostsPage/>},
                    {path: 'posts/new', element: <PostEditorPage mode="create"/>},
                    {path: 'posts/:postId/edit', element: <PostEditorPage mode="edit"/>},
                    {path: 'chat', element: <ChatPage/>},
                    {path: 'profile', element: <ProfilePage/>},
                ],
            },
            {
                element: <ProtectedRoute requiredRole="ROLE_ADMIN"/>,
                children: [
                    {path: 'admin', element: <AdminPage/>},
                ],
            },
        ],
    },
    {path: '*', element: <NotFoundPage/>},
]

export function AppRouter() {
    return useRoutes(routes)
}
