/** API origin. In dev, Vite proxies /api → Render (avoids CORS). In prod, set VITE_API_URL. */
export function getApiBaseUrl() {
  if (import.meta.env.DEV) {
    return '';
  }
  return (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
}

export const API_BASE_URL = getApiBaseUrl();

export function isApiEnabled() {
  return import.meta.env.DEV || API_BASE_URL.length > 0;
}
