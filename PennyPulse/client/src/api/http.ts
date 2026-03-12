const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:4000`;

export type ApiError = { message: string };

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
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
