/** API base: https://ongera-access-api.onrender.com — see /swagger/index.html */
export function getApiBaseUrl() {
  if (import.meta.env.DEV) return '';
  return (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
}

export function isApiEnabled() {
  return import.meta.env.DEV || getApiBaseUrl().length > 0;
}
