import { getApiBaseUrl } from '../config/api';
import type { ApiErrorBody } from '../types/api';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type ApiFetchOptions = RequestInit & {
  token?: string;
  json?: unknown;
};

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const base = getApiBaseUrl();
  if (!import.meta.env.DEV && !base) {
    throw new ApiError('API URL is not configured', 0);
  }

  const { token, json, headers, body, ...rest } = options;

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      ...rest,
      body: json !== undefined ? JSON.stringify(json) : body,
      headers: {
        ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new ApiError(
      'Cannot reach the API. If you are developing locally, restart the dev server.',
      0,
    );
  }

  const data = (await res.json().catch(() => ({}))) as T & ApiErrorBody;

  if (!res.ok) {
    throw new ApiError(data.error ?? `Request failed (${res.status})`, res.status);
  }

  return data;
}
