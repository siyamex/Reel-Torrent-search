import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
});

// A 401 on any protected endpoint means the session is missing/expired —
// send the user to the login page. Login/register themselves also return
// 401 for bad credentials, but that should surface as an inline form error
// instead of a redirect, so those two are excluded.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url ?? '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
    if (axios.isAxiosError(error) && error.response?.status === 401 && !isAuthEndpoint) {
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  },
);

export interface ApiErrorPayload {
  error: string;
  error_description: string;
}

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const payload = err.response?.data as ApiErrorPayload | undefined;
    if (payload?.error_description) return payload.error_description;
    if (err.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
    if (!err.response) return 'Unable to reach the server. Check your connection.';
    return `Request failed (${err.response.status})`;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}
