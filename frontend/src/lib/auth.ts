export type UserRole = 'ROLE_USER' | 'ROLE_ADMIN' | 'ROLE_SUPERVISOR';

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
  role: 'USER' | 'ADMIN';
  phone?: string;
}

const PRESEEDED_USERS: Record<string, { password: string; session: AuthSession }> = {
  admin: {
    password: 'Admin@12345',
    session: {
      access_token: 'mock-jwt-admin-sentinelx-token',
      refresh_token: 'mock-jwt-admin-refresh-token',
      username: 'admin',
      role: 'ROLE_ADMIN',
      user_id: 'usr-admin-001',
      first_name: 'Security',
      last_name: 'Administrator',
      email: 'admin@sentinelx.local',
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
    return {
      access_token: token,
      refresh_token: localStorage.getItem(REFRESH_TOKEN_KEY) || '',
      username: parsed.username || 'Operator',
      role: (parsed.role as UserRole) || 'ROLE_USER',
      user_id: parsed.userId || parsed.user_id || 'usr-default',
      first_name: parsed.firstName || parsed.first_name,
      last_name: parsed.lastName || parsed.last_name,
      email: parsed.email,
    };
  } catch {
    return null;
  }
}

export function persistSession(session: AuthSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, session.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token);
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      username: session.username,
      role: session.role,
      userId: session.user_id,
      firstName: session.first_name,
      lastName: session.last_name,
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
  const updated: AuthSession = { ...current, role: newRole };
  persistSession(updated);
  return updated;
}

function getLocalRegisteredUsers(): Record<string, { password: string; session: AuthSession }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalUser(username: string, record: { password: string; session: AuthSession }) {
  if (typeof window === 'undefined') return;
  const existing = getLocalRegisteredUsers();
  existing[username.toLowerCase()] = record;
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(existing));
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

    const session: AuthSession = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      username: data.username,
      role: data.role.startsWith('ROLE_') ? data.role : `ROLE_${data.role}`,
      user_id: data.user_id,
      first_name: data.first_name,
      last_name: data.last_name,
    };
    persistSession(session);
    return session;
  } catch (apiErr: unknown) {
    const errMessage = apiErr instanceof Error ? apiErr.message : '';
    // If it's a genuine 401 Bad Credentials from the backend, bubble that up
    if (errMessage && errMessage !== 'Failed to fetch' && !errMessage.includes('aborted')) {
      throw new Error(errMessage);
    }
  }

  // 2. Fallback to preseeded and locally registered mock users
  const localUsers = getLocalRegisteredUsers();
  const foundUser =
    PRESEEDED_USERS[identifier] ||
    Object.values(PRESEEDED_USERS).find((u) => u.session.email?.toLowerCase() === identifier) ||
    localUsers[identifier] ||
    Object.values(localUsers).find((u) => u.session.email?.toLowerCase() === identifier);

  if (!foundUser || foundUser.password !== password) {
    throw new Error('Invalid username or password. Check credentials or register a new account.');
  }

  persistSession(foundUser.session);
  return foundUser.session;
}

export async function registerUser(payload: RegisterPayload): Promise<AuthSession> {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  const roleCode: UserRole = payload.role === 'ADMIN' ? 'ROLE_ADMIN' : 'ROLE_USER';

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
        role: payload.role,
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
      username: data.username,
      role: (data.role?.startsWith('ROLE_') ? data.role : `ROLE_${data.role || payload.role}`) as UserRole,
      user_id: data.user_id,
      first_name: payload.first_name,
      last_name: payload.last_name,
      email: payload.email,
    };
    persistSession(session);
    return session;
  } catch (apiErr: unknown) {
    const errMessage = apiErr instanceof Error ? apiErr.message : '';
    // If it's a specific validation failure returned by the backend, bubble that up
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
    username: payload.username,
    role: roleCode,
    user_id: `usr-${Date.now().toString(36)}`,
    first_name: payload.first_name,
    last_name: payload.last_name,
    email: payload.email,
  };

  saveLocalUser(usernameKey, {
    password: payload.password,
    session: newSession,
  });

  persistSession(newSession);
  return newSession;
}
