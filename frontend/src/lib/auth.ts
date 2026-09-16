export type UserRole = 'ROLE_USER' | 'ROLE_ADMIN' | 'ROLE_SUPERVISOR' | 'ROLE_DISPATCHER';

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  username: string;
  role: UserRole;
  user_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: 'USER' | 'ADMIN';
  phone?: string;
}

// RBAC Configuration: Afifa is the single Super Admin
export const SUPER_ADMIN_EMAILS = [
  'afifasyed06@gmail.com',
  'afifa@sentinelx.local',
  'admin@sentinelx.local',
];

export const SUPER_ADMIN_USERNAMES = [
  'afifa',
  'admin',
];

/**
 * Checks whether an email or username belongs to Super Admin Afifa.
 */
export function isSuperAdmin(email?: string, username?: string): boolean {
  if (email && SUPER_ADMIN_EMAILS.includes(email.trim().toLowerCase())) return true;
  if (username && SUPER_ADMIN_USERNAMES.includes(username.trim().toLowerCase())) return true;
  return false;
}

/**
 * Formats a clean, readable human name without ugly IDs like `google_user_414`.
 */
export function formatDisplayName(
  user?: { first_name?: string; last_name?: string; username?: string; email?: string } | null
): string {
  if (!user) return 'Guest';

  // If this is Super Admin Afifa
  if (isSuperAdmin(user.email, user.username)) {
    return 'Afifa Syed';
  }

  // If first name exists and is not an auto-generated placeholder
  if (
    user.first_name &&
    !user.first_name.toLowerCase().includes('google') &&
    !user.first_name.toLowerCase().includes('github') &&
    !user.first_name.toLowerCase().includes('clerk')
  ) {
    return user.last_name ? `${user.first_name} ${user.last_name}`.trim() : user.first_name;
  }

  // If username exists and is not ugly generated string
  if (
    user.username &&
    !user.username.toLowerCase().startsWith('google_user') &&
    !user.username.toLowerCase().startsWith('github_user') &&
    !user.username.toLowerCase().startsWith('clerk_user')
  ) {
    return user.username;
  }

  // Derive human-readable name from email
  if (user.email) {
    if (user.email.toLowerCase() === 'afifasyed06@gmail.com') return 'Afifa Syed';
    const handle = user.email.split('@')[0];
    return handle
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return 'Campus Member';
}

const PRESEEDED_USERS: Record<string, { password: string; session: AuthSession }> = {
  afifa: {
    password: 'Admin@12345',
    session: {
      access_token: 'mock-jwt-afifa-superadmin-token',
      refresh_token: 'mock-jwt-afifa-refresh-token',
      username: 'Afifa',
      role: 'ROLE_ADMIN',
      user_id: 'usr-superadmin-afifa',
      first_name: 'Afifa',
      last_name: 'Syed',
      email: 'afifasyed06@gmail.com',
    },
  },
  admin: {
    password: 'Admin@12345',
    session: {
      access_token: 'mock-jwt-admin-sentinelx-token',
      refresh_token: 'mock-jwt-admin-refresh-token',
      username: 'Afifa',
      role: 'ROLE_ADMIN',
      user_id: 'usr-superadmin-afifa',
      first_name: 'Afifa',
      last_name: 'Syed',
      email: 'afifasyed06@gmail.com',
    },
  },
  campus_user: {
    password: 'User@12345',
    session: {
      access_token: 'mock-jwt-user-sentinelx-token',
      refresh_token: 'mock-jwt-user-refresh-token',
      username: 'campus_user',
      role: 'ROLE_USER',
      user_id: 'usr-user-002',
      first_name: 'Alex',
      last_name: 'Reynolds',
      email: 'user@campus.edu',
    },
  },
};

const LOCAL_USERS_KEY = 'sentinelx_registered_users';
const TOKEN_KEY = 'sentinelx_token';
const REFRESH_TOKEN_KEY = 'sentinelx_refresh_token';
const USER_KEY = 'sentinelx_user';

export function getSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(TOKEN_KEY);
  const userJson = localStorage.getItem(USER_KEY);
  if (!token || !userJson) return null;

  try {
    const parsed = JSON.parse(userJson);
    const role = (parsed.role as UserRole) || 'ROLE_USER';
    const email = parsed.email;
    const username = parsed.username || 'Operator';

    // Auto-escalate if it's Super Admin Afifa
    const effectiveRole: UserRole = isSuperAdmin(email, username) ? 'ROLE_ADMIN' : role;

    return {
      access_token: token,
      refresh_token: localStorage.getItem(REFRESH_TOKEN_KEY) || '',
      username: isSuperAdmin(email, username) ? 'Afifa' : username,
      role: effectiveRole,
      user_id: parsed.userId || parsed.user_id || 'usr-default',
      first_name: isSuperAdmin(email, username) ? 'Afifa' : (parsed.firstName || parsed.first_name),
      last_name: isSuperAdmin(email, username) ? 'Syed' : (parsed.lastName || parsed.last_name),
      email,
    };
  } catch {
    return null;
  }
}

export function persistSession(session: AuthSession): void {
  if (typeof window === 'undefined') return;

  const isAfifa = isSuperAdmin(session.email, session.username);
  const cleanUsername = isAfifa ? 'Afifa' : (session.username.startsWith('google_user_') ? (session.first_name || 'Member') : session.username);
  const cleanFirstName = isAfifa ? 'Afifa' : (session.first_name?.includes('Google') ? 'Campus' : session.first_name);
  const cleanLastName = isAfifa ? 'Syed' : (session.last_name?.includes('User') ? 'Member' : session.last_name);
  const enforcedRole: UserRole = isAfifa ? 'ROLE_ADMIN' : session.role;

  localStorage.setItem(TOKEN_KEY, session.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token);
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      username: cleanUsername,
      role: enforcedRole,
      userId: session.user_id,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      email: session.email,
    })
  );
  window.dispatchEvent(new Event('sentinelx_auth_change'));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event('sentinelx_auth_change'));
}

export function switchRole(newRole: UserRole): AuthSession | null {
  const current = getSession();
  if (!current) return null;

  // Strict RBAC: Only Super Admin Afifa can switch to ROLE_ADMIN
  if (newRole === 'ROLE_ADMIN' && !isSuperAdmin(current.email, current.username)) {
    throw new Error('Access Denied: Only Super Admin Afifa has administrative clearance.');
  }

  const updated: AuthSession = { ...current, role: newRole };
  persistSession(updated);
  return updated;
}

export function getLocalRegisteredUsers(): Record<string, { password: string; session: AuthSession }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalUser(username: string, record: { password: string; session: AuthSession }) {
  if (typeof window === 'undefined') return;
  const existing = getLocalRegisteredUsers();
  existing[username.toLowerCase()] = record;
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(existing));
}

/**
 * Super Admin RBAC User Directory Management:
 * Returns all system users for Afifa to inspect and manage.
 */
export function getRBACUserDirectory(): Array<{
  userId: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  isSuperAdmin: boolean;
}> {
  const localUsers = getLocalRegisteredUsers();
  const list: Array<{
    userId: string;
    username: string;
    email: string;
    name: string;
    role: UserRole;
    isSuperAdmin: boolean;
  }> = [
    {
      userId: 'usr-superadmin-afifa',
      username: 'Afifa',
      email: 'afifasyed06@gmail.com',
      name: 'Afifa Syed',
      role: 'ROLE_ADMIN',
      isSuperAdmin: true,
    },
    {
      userId: 'usr-user-002',
      username: 'campus_user',
      email: 'user@campus.edu',
      name: 'Alex Reynolds',
      role: 'ROLE_USER',
      isSuperAdmin: false,
    },
  ];

  Object.entries(localUsers).forEach(([_, u]) => {
    const isAf = isSuperAdmin(u.session.email, u.session.username);
    if (!list.find((x) => x.email.toLowerCase() === (u.session.email || '').toLowerCase())) {
      list.push({
        userId: u.session.user_id,
        username: u.session.username,
        email: u.session.email || `${u.session.username}@campus.edu`,
        name: formatDisplayName(u.session),
        role: isAf ? 'ROLE_ADMIN' : u.session.role,
        isSuperAdmin: isAf,
      });
    }
  });

  return list;
}

/**
 * Super Admin Afifa can update another user's role (RBAC Delegation).
 */
export function updateDelegatedUserRole(targetEmailOrUsername: string, newRole: UserRole): boolean {
  const current = getSession();
  if (!current || !isSuperAdmin(current.email, current.username)) {
    throw new Error('Only Super Admin Afifa has authority to delegate roles.');
  }

  const localUsers = getLocalRegisteredUsers();
  const key = targetEmailOrUsername.toLowerCase();

  for (const [k, u] of Object.entries(localUsers)) {
    if (k === key || u.session.email?.toLowerCase() === key || u.session.username.toLowerCase() === key) {
      localUsers[k].session.role = newRole;
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(localUsers));
      return true;
    }
  }

  return false;
}

export async function authenticate(usernameOrEmail: string, password: string): Promise<AuthSession> {
  const identifier = usernameOrEmail.trim().toLowerCase();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

  // 1. Try real backend API first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: identifier, password }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Invalid username or password');
    }

    const backendRole = data.role.startsWith('ROLE_') ? data.role : `ROLE_${data.role}`;
    const effectiveRole: UserRole = isSuperAdmin(data.email, data.username) ? 'ROLE_ADMIN' : backendRole;

    const session: AuthSession = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      username: isSuperAdmin(data.email, data.username) ? 'Afifa' : data.username,
      role: effectiveRole,
      user_id: data.user_id,
      first_name: isSuperAdmin(data.email, data.username) ? 'Afifa' : data.first_name,
      last_name: isSuperAdmin(data.email, data.username) ? 'Syed' : data.last_name,
      email: data.email,
    };
    persistSession(session);
    return session;
  } catch (apiErr: unknown) {
    const errMessage = apiErr instanceof Error ? apiErr.message : '';
    if (errMessage && errMessage !== 'Failed to fetch' && !errMessage.includes('aborted')) {
      throw new Error(errMessage);
    }
  }

  // 2. Fallback to preseeded and locally registered users
  const localUsers = getLocalRegisteredUsers();
  const foundUser =
    PRESEEDED_USERS[identifier] ||
    Object.values(PRESEEDED_USERS).find((u) => u.session.email?.toLowerCase() === identifier) ||
    localUsers[identifier] ||
    Object.values(localUsers).find((u) => u.session.email?.toLowerCase() === identifier);

  if (!foundUser || foundUser.password !== password) {
    throw new Error('Invalid username or password. Check credentials or register a new account.');
  }

  // Ensure RBAC integrity
  const session = { ...foundUser.session };
  if (isSuperAdmin(session.email, session.username)) {
    session.role = 'ROLE_ADMIN';
    session.username = 'Afifa';
    session.first_name = 'Afifa';
    session.last_name = 'Syed';
  }

  persistSession(session);
  return session;
}

export async function registerUser(payload: RegisterPayload): Promise<AuthSession> {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

  // Strict RBAC: All endless users are strictly ROLE_USER. Only Afifa can be ROLE_ADMIN.
  const isAfifa = isSuperAdmin(payload.email, payload.username);
  const assignedRole: UserRole = isAfifa ? 'ROLE_ADMIN' : 'ROLE_USER';

  // 1. Try real backend API first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: payload.username,
        email: payload.email,
        password: payload.password,
        first_name: payload.first_name,
        last_name: payload.last_name,
        phone: payload.phone || '+10000000000',
        role: isAfifa ? 'ADMIN' : 'USER',
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await res.json();
    if (!res.ok) {
      if (data.details) {
        const firstDetail = Object.values(data.details)[0];
        throw new Error(String(firstDetail));
      }
      throw new Error(data.message || 'Registration failed');
    }

    const session: AuthSession = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      username: isAfifa ? 'Afifa' : data.username,
      role: assignedRole,
      user_id: data.user_id,
      first_name: isAfifa ? 'Afifa' : payload.first_name,
      last_name: isAfifa ? 'Syed' : payload.last_name,
      email: payload.email,
    };
    persistSession(session);
    return session;
  } catch (apiErr: unknown) {
    const errMessage = apiErr instanceof Error ? apiErr.message : '';
    if (errMessage && errMessage !== 'Failed to fetch' && !errMessage.includes('aborted')) {
      throw new Error(errMessage);
    }
  }

  // 2. Fallback to local persistent registration
  const localUsers = getLocalRegisteredUsers();
  const usernameKey = payload.username.toLowerCase();
  if (PRESEEDED_USERS[usernameKey] || localUsers[usernameKey]) {
    throw new Error('Username is already taken. Please choose another username.');
  }

  const newSession: AuthSession = {
    access_token: `mock-jwt-${payload.username}-${Date.now()}`,
    refresh_token: `mock-refresh-${payload.username}-${Date.now()}`,
    username: isAfifa ? 'Afifa' : payload.username,
    role: assignedRole,
    user_id: `usr-${Date.now().toString(36)}`,
    first_name: isAfifa ? 'Afifa' : payload.first_name,
    last_name: isAfifa ? 'Syed' : payload.last_name,
    email: payload.email,
  };

  saveLocalUser(usernameKey, {
    password: payload.password,
    session: newSession,
  });

  persistSession(newSession);
  return newSession;
}
