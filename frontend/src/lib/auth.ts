export type UserRole = 'ROLE_USER' | 'ROLE_ADMIN';

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

// RBAC Configuration: named Super Admins, each with their own identity.
// A super admin is recognized by email OR username matching their entry
// below; whichever one matched, their session gets normalized to their
// real name/userId (see resolveSuperAdminIdentity).
interface SuperAdminProfile {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
}

export const SUPER_ADMINS: SuperAdminProfile[] = [
  { userId: 'usr-superadmin-afifa', username: 'Afifa', firstName: 'Afifa', lastName: 'Syed', email: 'afifasyed06@gmail.com' },
  { userId: 'usr-superadmin-satyam', username: 'Satyam', firstName: 'Satyam', lastName: 'Pandey', email: 'pandeysatyam1802@gmail.com' },
];

// The generic 'admin' / 'admin@sentinelx.local' login (also the backend's
// seeded demo account) has always resolved to Afifa's identity -- kept as
// an alias rather than a third distinct admin.
const GENERIC_ADMIN_ALIAS_EMAILS = ['afifa@sentinelx.local', 'admin@sentinelx.local'];
const GENERIC_ADMIN_ALIAS_USERNAMES = ['admin'];

export const SUPER_ADMIN_EMAILS = [...SUPER_ADMINS.map((a) => a.email), ...GENERIC_ADMIN_ALIAS_EMAILS];
export const SUPER_ADMIN_USERNAMES = [...SUPER_ADMINS.map((a) => a.username.toLowerCase()), ...GENERIC_ADMIN_ALIAS_USERNAMES];

/**
 * Looks up which named Super Admin an email/username belongs to, if any.
 * The generic 'admin' alias resolves to Afifa's profile.
 */
export function resolveSuperAdminIdentity(email?: string, username?: string): SuperAdminProfile | null {
  const e = email?.trim().toLowerCase();
  const u = username?.trim().toLowerCase();

  const named = SUPER_ADMINS.find((a) => (e && a.email.toLowerCase() === e) || (u && a.username.toLowerCase() === u));
  if (named) return named;

  if ((e && GENERIC_ADMIN_ALIAS_EMAILS.includes(e)) || (u && GENERIC_ADMIN_ALIAS_USERNAMES.includes(u))) {
    return SUPER_ADMINS[0]; // Afifa
  }

  return null;
}

/**
 * Checks whether an email or username belongs to any Super Admin.
 */
export function isSuperAdmin(email?: string, username?: string): boolean {
  return resolveSuperAdminIdentity(email, username) !== null;
}

/**
 * Formats a clean, readable human name without ugly IDs like `google_user_414`.
 */
export function formatDisplayName(
  user?: { first_name?: string; last_name?: string; username?: string; email?: string } | null
): string {
  if (!user) return 'Guest';

  // If this is a named Super Admin, always show their real name
  const superAdmin = resolveSuperAdminIdentity(user.email, user.username);
  if (superAdmin) {
    return `${superAdmin.firstName} ${superAdmin.lastName}`;
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
  satyam: {
    password: 'Admin@12345',
    session: {
      access_token: 'mock-jwt-satyam-superadmin-token',
      refresh_token: 'mock-jwt-satyam-refresh-token',
      username: 'Satyam',
      role: 'ROLE_ADMIN',
      user_id: 'usr-superadmin-satyam',
      first_name: 'Satyam',
      last_name: 'Pandey',
      email: 'pandeysatyam1802@gmail.com',
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
const DELEGATED_ROLES_KEY = 'sentinelx_delegated_roles';
const TOKEN_KEY = 'sentinelx_token';
const REFRESH_TOKEN_KEY = 'sentinelx_refresh_token';
const USER_KEY = 'sentinelx_user';

export function getDelegatedRoles(): Record<string, UserRole> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(DELEGATED_ROLES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

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

    // Auto-escalate if it's a named Super Admin or has delegated role
    const superAdmin = resolveSuperAdminIdentity(email, username);
    const delegated = getDelegatedRoles();
    const delegatedRole = (username && delegated[username.toLowerCase()]) || (email && delegated[email.toLowerCase()]);
    const effectiveRole: UserRole = superAdmin ? 'ROLE_ADMIN' : (delegatedRole || role);

    return {
      access_token: token,
      refresh_token: localStorage.getItem(REFRESH_TOKEN_KEY) || '',
      username: superAdmin ? superAdmin.username : username,
      role: effectiveRole,
      user_id: parsed.userId || parsed.user_id || 'usr-default',
      first_name: superAdmin ? superAdmin.firstName : (parsed.firstName || parsed.first_name),
      last_name: superAdmin ? superAdmin.lastName : (parsed.lastName || parsed.last_name),
      email,
    };
  } catch {
    return null;
  }
}

export function persistSession(session: AuthSession): void {
  if (typeof window === 'undefined') return;

  const superAdmin = resolveSuperAdminIdentity(session.email, session.username);
  const delegated = getDelegatedRoles();
  const delegatedRole = (session.username && delegated[session.username.toLowerCase()]) || (session.email && delegated[session.email.toLowerCase()]);
  const cleanUsername = superAdmin ? superAdmin.username : (session.username.startsWith('google_user_') ? (session.first_name || 'Member') : session.username);
  const cleanFirstName = superAdmin ? superAdmin.firstName : (session.first_name?.includes('Google') ? 'Campus' : session.first_name);
  const cleanLastName = superAdmin ? superAdmin.lastName : (session.last_name?.includes('User') ? 'Member' : session.last_name);
  const enforcedRole: UserRole = superAdmin ? 'ROLE_ADMIN' : (delegatedRole || session.role);

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

  // Strict RBAC: Only a named Super Admin can switch to ROLE_ADMIN
  if (newRole === 'ROLE_ADMIN' && !isSuperAdmin(current.email, current.username)) {
    throw new Error('Access Denied: Only a Super Admin has administrative clearance.');
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
  const delegated = getDelegatedRoles();

  const getEffectiveRole = (email?: string, username?: string, defaultRole: UserRole = 'ROLE_USER'): UserRole => {
    const isAf = isSuperAdmin(email, username);
    if (isAf) return 'ROLE_ADMIN';
    const e = email?.toLowerCase();
    const u = username?.toLowerCase();
    if (u && delegated[u]) return delegated[u];
    if (e && delegated[e]) return delegated[e];
    return defaultRole;
  };

  const list: Array<{
    userId: string;
    username: string;
    email: string;
    name: string;
    role: UserRole;
    isSuperAdmin: boolean;
  }> = [
    ...SUPER_ADMINS.map((a) => ({
      userId: a.userId,
      username: a.username,
      email: a.email,
      name: `${a.firstName} ${a.lastName}`,
      role: 'ROLE_ADMIN' as UserRole,
      isSuperAdmin: true,
    })),
    {
      userId: 'usr-user-002',
      username: 'campus_user',
      email: 'user@campus.edu',
      name: 'Alex Reynolds',
      role: getEffectiveRole('user@campus.edu', 'campus_user', 'ROLE_USER'),
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
        role: getEffectiveRole(u.session.email, u.session.username, isAf ? 'ROLE_ADMIN' : u.session.role),
        isSuperAdmin: isAf,
      });
    }
  });

  return list;
}

/**
 * A Super Admin can update another user's role (RBAC Delegation).
 */
export function updateDelegatedUserRole(
  targetEmailOrUsername: string,
  newRole: UserRole,
  secondaryIdentifier?: string
): boolean {
  const current = getSession();
  if (!current || !isSuperAdmin(current.email, current.username)) {
    throw new Error('Only a Super Admin has authority to delegate roles.');
  }

  const delegated = getDelegatedRoles();
  const key1 = targetEmailOrUsername.toLowerCase();
  delegated[key1] = newRole;

  if (secondaryIdentifier) {
    delegated[secondaryIdentifier.toLowerCase()] = newRole;
  }

  // Cross-reference preseeded campus user
  if (
    key1 === 'campus_user' ||
    key1 === 'user@campus.edu' ||
    secondaryIdentifier?.toLowerCase() === 'user@campus.edu' ||
    secondaryIdentifier?.toLowerCase() === 'campus_user'
  ) {
    delegated['campus_user'] = newRole;
    delegated['user@campus.edu'] = newRole;
    if (PRESEEDED_USERS['campus_user']) {
      PRESEEDED_USERS['campus_user'].session.role = newRole;
    }
  }

  localStorage.setItem(DELEGATED_ROLES_KEY, JSON.stringify(delegated));

  const localUsers = getLocalRegisteredUsers();
  for (const [k, u] of Object.entries(localUsers)) {
    const match =
      k === key1 ||
      u.session.email?.toLowerCase() === key1 ||
      u.session.username.toLowerCase() === key1 ||
      (secondaryIdentifier &&
        (u.session.email?.toLowerCase() === secondaryIdentifier.toLowerCase() ||
          u.session.username.toLowerCase() === secondaryIdentifier.toLowerCase()));
    if (match) {
      localUsers[k].session.role = newRole;
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(localUsers));
    }
  }

  if (
    current.username.toLowerCase() === key1 ||
    current.email?.toLowerCase() === key1 ||
    (secondaryIdentifier &&
      (current.username.toLowerCase() === secondaryIdentifier.toLowerCase() ||
        current.email?.toLowerCase() === secondaryIdentifier.toLowerCase()))
  ) {
    persistSession({ ...current, role: newRole });
  }

  window.dispatchEvent(new Event('sentinelx_auth_change'));
  return true;
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
    const loginSuperAdmin = resolveSuperAdminIdentity(data.email, data.username);
    const effectiveRole: UserRole = loginSuperAdmin ? 'ROLE_ADMIN' : backendRole;

    const session: AuthSession = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      username: loginSuperAdmin ? loginSuperAdmin.username : data.username,
      role: effectiveRole,
      user_id: data.user_id,
      first_name: loginSuperAdmin ? loginSuperAdmin.firstName : data.first_name,
      last_name: loginSuperAdmin ? loginSuperAdmin.lastName : data.last_name,
      email: data.email,
    };
    persistSession(session);
    return session;
  } catch (apiErr: unknown) {
    const errMessage = apiErr instanceof Error ? apiErr.message : '';
    const localUsers = getLocalRegisteredUsers();
    const fallbackCandidate =
      PRESEEDED_USERS[identifier] ||
      Object.values(PRESEEDED_USERS).find((u) => u.session.email?.toLowerCase() === identifier) ||
      localUsers[identifier] ||
      Object.values(localUsers).find((u) => u.session.email?.toLowerCase() === identifier);

    if (fallbackCandidate && fallbackCandidate.password === password) {
      // Gracefully fall through to preseeded/local user session
    } else if (errMessage && errMessage !== 'Failed to fetch' && !errMessage.includes('aborted')) {
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
  const fallbackSuperAdmin = resolveSuperAdminIdentity(session.email, session.username);
  if (fallbackSuperAdmin) {
    session.role = 'ROLE_ADMIN';
    session.username = fallbackSuperAdmin.username;
    session.first_name = fallbackSuperAdmin.firstName;
    session.last_name = fallbackSuperAdmin.lastName;
  }

  persistSession(session);
  return session;
}

export async function registerUser(payload: RegisterPayload): Promise<AuthSession> {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

  // Strict RBAC: All standard end-users are strictly ROLE_USER. Only a named Super Admin can be ROLE_ADMIN.
  const regSuperAdmin = resolveSuperAdminIdentity(payload.email, payload.username);
  const assignedRole: UserRole = regSuperAdmin ? 'ROLE_ADMIN' : 'ROLE_USER';

  // 1. Try real backend API first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    // No `role` field sent: the backend never trusts a client-supplied role
    // on public self-registration (every new account is ROLE_USER there,
    // regardless of what's sent) -- Afifa/Satyam are real seeded ROLE_ADMIN
    // accounts instead, so signing up with their email correctly fails as
    // "already registered" rather than this code path ever running for them.
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
      username: regSuperAdmin ? regSuperAdmin.username : data.username,
      role: assignedRole,
      user_id: data.user_id,
      first_name: regSuperAdmin ? regSuperAdmin.firstName : payload.first_name,
      last_name: regSuperAdmin ? regSuperAdmin.lastName : payload.last_name,
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
    username: regSuperAdmin ? regSuperAdmin.username : payload.username,
    role: assignedRole,
    user_id: `usr-${Date.now().toString(36)}`,
    first_name: regSuperAdmin ? regSuperAdmin.firstName : payload.first_name,
    last_name: regSuperAdmin ? regSuperAdmin.lastName : payload.last_name,
    email: payload.email,
  };

  saveLocalUser(usernameKey, {
    password: payload.password,
    session: newSession,
  });

  persistSession(newSession);
  return newSession;
}
