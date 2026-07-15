import { isApiEnabled } from '../config/api';
import {
  clearSession,
  loadSession,
  loadStoredUsers,
  saveSession,
  saveStoredUsers,
  type StoredUser,
} from '../lib/authStorage';
import { apiFetch } from '../lib/apiClient';
import type { ApiLoginResponse, ApiRegisterRequest, ApiUser } from '../types/api';
import type { AuthSession, AuthUser, LoginCredentials, SignupData } from '../types/auth';
import { getTherapistProfile, resolveTherapistProfileId } from './therapistService';

const DEMO_ACCOUNT = {
  email: 'claudine@ongera.rw',
  password: 'password123',
  user: {
    id: 'demo-1',
    email: 'claudine@ongera.rw',
    firstName: 'Claudine',
    lastName: 'Uwimana',
    role: 'therapist',
    location: 'Kigali, Rwanda',
    affiliation: 'Kigali Speech Therapy Center',
    specialty: 'Speech & Language Pathologist',
    isVerified: true,
  },
};

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

  if (!isApiEnabled()) {
    const stored = loadStoredUsers().find((u) => u.id === session.user.id);
    if (!stored) return session;

    return {
      ...session,
      user: {
        ...session.user,
        affiliation: stored.affiliation,
        specialty: stored.specialty,
        isVerified: stored.isVerified ?? false,
      },
    };
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

async function loginWithMock(credentials: LoginCredentials): Promise<AuthSession> {
  const email = credentials.email.trim().toLowerCase();

  if (email === DEMO_ACCOUNT.email && credentials.password === DEMO_ACCOUNT.password) {
    return enrichTherapistSession(toSession(DEMO_ACCOUNT.user, 'mock-token-demo'));
  }

  const stored = loadStoredUsers().find(
    (u) => u.email.toLowerCase() === email || u.username.toLowerCase() === email,
  );

  if (!stored || stored.password !== credentials.password) {
    throw new Error('Invalid email or password');
  }

  return enrichTherapistSession(
    toSession(
      {
        id: stored.id,
        email: stored.email,
        firstName: stored.firstName,
        lastName: stored.lastName,
        role: 'therapist',
        location: stored.location,
        affiliation: stored.affiliation,
        specialty: stored.specialty,
        isVerified: stored.isVerified ?? false,
      },
      `mock-token-${stored.id}`,
    ),
  );
}

async function signupWithMock(data: SignupData): Promise<AuthSession> {
  const email = data.email.trim().toLowerCase();
  const users = loadStoredUsers();

  if (users.some((u) => u.email.toLowerCase() === email)) {
    throw new Error('Email is already registered');
  }

  if (email === DEMO_ACCOUNT.email) {
    throw new Error('This account already exists — try logging in');
  }

  const newUser: StoredUser = {
    id: `local-${Date.now()}`,
    username: email.split('@')[0] ?? email,
    email,
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    location: data.location?.trim() || undefined,
    affiliation: data.affiliation.trim(),
    specialty: data.specialty.trim(),
    isVerified: false,
    password: data.password,
  };

  saveStoredUsers([...users, newUser]);

  return enrichTherapistSession(
    toSession(
      {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: 'therapist',
        location: newUser.location,
        affiliation: newUser.affiliation,
        specialty: newUser.specialty,
        isVerified: false,
      },
      `mock-token-${newUser.id}`,
    ),
  );
}

export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  const session = isApiEnabled()
    ? await loginWithApi(credentials)
    : await loginWithMock(credentials);

  saveSession(session);
  return session;
}

export async function signup(data: SignupData): Promise<AuthSession> {
  const session = isApiEnabled() ? await signupWithApi(data) : await signupWithMock(data);
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

  if (!isApiEnabled()) {
    return enrichTherapistSession(session);
  }

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
