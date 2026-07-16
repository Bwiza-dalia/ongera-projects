import {
  clearSession,
  loadSession,
  saveSession,
} from '../lib/authStorage';
import { apiFetch } from '../lib/apiClient';
import type { ApiLoginResponse, ApiRegisterRequest, ApiUser } from '../types/api';
import type { AuthSession, AuthUser, LoginCredentials, SignupData } from '../types/auth';
import { getTherapistProfile, resolveTherapistProfileId } from './therapistService';

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

async function enrichTherapistSession(session: AuthSession): Promise<AuthSession> {
  if (session.user.role !== 'therapist') {
    return session;
  }

  try {
    const profileId = await resolveTherapistProfileId(
      session.token,
      session.user.id,
      `${session.user.firstName} ${session.user.lastName}`,
    );
    const profile = await getTherapistProfile(session.token, profileId);

    return {
      ...session,
      user: {
        ...session.user,
        affiliation: profile.affiliation,
        specialty: profile.specialty,
        isVerified: profile.is_verified ?? false,
      },
    };
  } catch {
    return {
      ...session,
      user: {
        ...session.user,
        isVerified: false,
      },
    };
  }
}

async function loginWithApi(credentials: LoginCredentials): Promise<AuthSession> {
  const data = await apiFetch<ApiLoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    json: {
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    },
  });

  return enrichTherapistSession(toSession(mapApiUser(data.user), data.token));
}

async function signupWithApi(data: SignupData): Promise<AuthSession> {
  const payload: ApiRegisterRequest = {
    email: data.email.trim().toLowerCase(),
    first_name: data.firstName.trim(),
    last_name: data.lastName.trim(),
    password: data.password,
    role: 'therapist',
    location: data.location?.trim() || undefined,
    affiliation: data.affiliation.trim(),
    specialty: data.specialty.trim(),
  };

  await apiFetch<ApiUser>('/api/v1/auth/register', {
    method: 'POST',
    json: payload,
  });

  return loginWithApi({ email: payload.email, password: data.password });
}

async function fetchCurrentUser(token: string): Promise<AuthUser> {
  const user = await apiFetch<ApiUser>('/api/v1/auth/me', { token });
  return mapApiUser(user);
}

export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  const session = await loginWithApi(credentials);
  saveSession(session);
  return session;
}

export async function signup(data: SignupData): Promise<AuthSession> {
  const session = await signupWithApi(data);
  saveSession(session);
  return session;
}

export function logout() {
  clearSession();
}

export function getSession(): AuthSession | null {
  return loadSession();
}

export async function restoreSession(): Promise<AuthSession | null> {
  const session = loadSession();
  if (!session) return null;

  try {
    const user = await fetchCurrentUser(session.token);
    const next = await enrichTherapistSession(toSession(user, session.token));
    saveSession(next);
    return next;
  } catch {
    clearSession();
    return null;
  }
}

export async function refreshSession(): Promise<AuthSession | null> {
  return restoreSession();
}

export function getPostAuthPath(user: AuthUser): string {
  if (user.role === 'therapist' && user.isVerified === false) {
    return '/pending-approval';
  }
  return '/';
}
