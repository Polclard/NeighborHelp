export const primaryNavigation = [
  { to: '/map', labelKey: 'nav.explore' },
  { to: '/posts', labelKey: 'nav.posts', requiresAuth: true },
  { to: '/chat', labelKey: 'nav.messages', requiresAuth: true },
  { to: '/profile', labelKey: 'nav.profile', requiresAuth: true },
  { to: '/admin', labelKey: 'nav.admin', requiresRole: 'ROLE_ADMIN' },
]
