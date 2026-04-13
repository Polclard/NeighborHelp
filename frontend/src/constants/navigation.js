export const primaryNavigation = [
  { to: '/map', label: 'Explore' },
  { to: '/posts', label: 'My posts', requiresAuth: true },
  { to: '/chat', label: 'Messages', requiresAuth: true },
  { to: '/profile', label: 'Profile', requiresAuth: true },
  { to: '/admin', label: 'Admin', requiresRole: 'ROLE_ADMIN' },
]
