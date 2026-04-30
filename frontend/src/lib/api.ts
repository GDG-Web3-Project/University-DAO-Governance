const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const STORAGE_KEY = 'university-dao-token';

export const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
};

export const saveToken = (token: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, token);
};

export const removeToken = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
};

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const text = await response.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
    const message = payload?.message || response.statusText || 'Request failed';
    throw new Error(message);
  }

  return response.json();
}
