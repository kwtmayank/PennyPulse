const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:4000`;
const AUTH_TOKEN_KEY = 'pennypulse_auth_token';

export type ApiError = { message: string };

function getStoredAuthToken() {
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY) || '';
  } catch (_err) {
    return '';
  }
}

export function setAuthToken(token: string) {
  try {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (_err) {
    // ignore storage errors
  }
}

export function clearAuthToken() {
  try {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (_err) {
    // ignore storage errors
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredAuthToken();
  const headers = new Headers(options.headers || undefined);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include'
    });
  } catch (_err) {
    throw new Error('Unable to reach the server. Please check your connection and try again.');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error((data as ApiError).message || 'Request failed');
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body || {}) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body || {}) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' })
};
