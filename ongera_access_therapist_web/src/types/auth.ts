export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  location?: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  location?: string;
}

export function displayName(user: Pick<AuthUser, 'firstName' | 'lastName'>) {
  return `${user.firstName} ${user.lastName}`.trim();
}
