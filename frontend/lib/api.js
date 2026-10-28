export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050').replace(/\/$/, '');
// Server components can reach the API directly on the same machine instead of going out through the public domain.
const SERVER_API_URL = (process.env.INTERNAL_API_URL || API_URL).replace(/\/$/, '');
const baseUrl = () => (typeof window === 'undefined' ? SERVER_API_URL : API_URL);
export const TOKEN_KEY = 'ms_token';

export function getToken() {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/** Fetch wrapper for the Express API. Works in server and client components. */
export async function api(path, { method = 'GET', body, token, headers, ...rest } = {}) {
  const auth = token ?? getToken();
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  let res;
  try {
    res = await fetch(`${baseUrl()}/api${path}`, {
      method,
      headers: {
        ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}),
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
        ...headers,
      },
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
      cache: 'no-store',
      ...rest,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Please check your connection and try again.', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.message || 'Something went wrong', res.status);
  return data;
}

/** Same as api() but returns null instead of throwing — handy in server components. */
export async function apiSafe(path, opts) {
  try {
    return await api(path, opts);
  } catch {
    return null;
  }
}

export function img(url) {
  if (!url) return '/brand/cat-banarasi.jpg';
  if (url.startsWith('/uploads')) return `${API_URL}${url}`;
  return url;
}
