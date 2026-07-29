const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Wrapper around fetch that automatically prepends the API base URL.
 * In development (Vite proxy), API_BASE is empty so calls go to same origin.
 * In production, API_BASE points to the deployed backend URL.
 */
export function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  return fetch(url, {
    ...options,
    credentials: 'include',
  });
}

/**
 * Get the full auth URL for redirects (e.g., Google OAuth).
 */
export function getAuthUrl(path) {
  return `${API_BASE}${path}`;
}
