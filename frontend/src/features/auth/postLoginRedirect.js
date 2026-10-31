// Role requirements for protected routes (mirrors RequireRole usage in app/router.jsx).
const PROTECTED_ROUTE_ROLES = [
  { prefix: '/admin/inventory', roles: ['ADMIN', 'LENDER'] },
  { prefix: '/admin', roles: ['ADMIN'] },
  { prefix: '/shop-admin.html', roles: ['ADMIN'] },
  { prefix: '/shipper', roles: ['SHIPPER'] },
];

function matchesPrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Returns a safe post-login destination: only same-site relative paths, and never
 * a role-protected page the signed-in user is not allowed to open.
 */
export function resolvePostLoginRedirect(redirect, role, fallback = '/') {
  if (typeof redirect !== 'string' || !redirect.startsWith('/') || redirect.startsWith('//') || redirect.startsWith('/\\')) {
    return fallback;
  }

  const pathname = redirect.split(/[?#]/)[0].toLowerCase();
  const rule = PROTECTED_ROUTE_ROLES.find((item) => matchesPrefix(pathname, item.prefix));
  if (rule && !rule.roles.includes(String(role || '').toUpperCase())) {
    return fallback;
  }

  return redirect;
}

