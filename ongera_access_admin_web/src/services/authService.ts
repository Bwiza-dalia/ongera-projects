import { clearSession, loadSession, saveSession } from '../lib/authStorage';
import { apiFetch } from '../lib/apiClient';
import type { ApiLoginResponse, ApiUser } from '../types/api';
import type { AuthSession, AuthUser, LoginCredentials } from '../types/auth';

function mapApiUser(user: ApiUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
    location: user.location,
  };
}

function toSession(user: AuthUser, token: string): AuthSession {
  return { token, user };
}

export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  const data = await apiFetch<ApiLoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    json: {
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    },
  });

  const session = toSession(mapApiUser(data.user), data.token);
  if (session.user.role !== 'admin') {
    throw new Error('Admin access only. Sign in with an admin account.');
  }
  saveSession(session);
  return session;
}

export function logout() {
  clearSession();
}

export async function restoreSession(): Promise<AuthSession | null> {
  const session = loadSession();
  if (!session) return null;

  if (session.user.role !== 'admin') {
    clearSession();
    return null;
  }

  try {
    const user = await apiFetch<ApiUser>('/api/v1/auth/me', { token: session.token });
    const mapped = mapApiUser(user);
    if (mapped.role !== 'admin') {
      clearSession();
      return null;
    }
    const next = toSession(mapped, session.token);
    saveSession(next);
    return next;
  } catch {
    clearSession();
    return null;
  }
}
