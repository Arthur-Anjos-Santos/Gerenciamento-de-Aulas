import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

let isRefreshing = false;
let refreshSubscribers: Array<(t: string) => void> = [];

const apiClient = axios.create({
  baseURL: API_URL,
});

export const setAuthHeader = (token?: string) => {
  if (token) (apiClient.defaults.headers as any).Authorization = `Bearer ${token}`;
  else delete (apiClient.defaults.headers as any).Authorization;
};

export const loadAuthFromStorage = () => {
  const token = localStorage.getItem('token');
  if (token) setAuthHeader(token);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }

  const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;
  if (isFormData) {
    if (config.headers) {
      delete (config.headers as any)['Content-Type'];
      delete (config.headers as any)['content-type'];
    }
  } else {
    if (config.headers && !(config.headers as any)['Content-Type']) {
      (config.headers as any)['Content-Type'] = 'application/json; charset=utf-8';
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error.config || {};
    const reqUrl: string = originalRequest?.url || '';
    const isAuthEndpoint = reqUrl.includes('/api/auth/login') || reqUrl.includes('/api/auth/refresh');

    if (status === 401 && !isAuthEndpoint && !originalRequest._retry) {
      const refresh = localStorage.getItem('refresh');
      if (refresh) {
        if (isRefreshing) {
          return new Promise((resolve) => {
            refreshSubscribers.push((token: string) => {
              originalRequest._retry = true;
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            });
          });
        }
        isRefreshing = true;
        try {
          const res = await axios.post(`${API_URL}/api/auth/refresh/`, { refresh });
          const newAccess = res.data.access;
          localStorage.setItem('token', newAccess);
          setAuthHeader(newAccess);
          isRefreshing = false;
          onRefreshed(newAccess);
          originalRequest._retry = true;
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return apiClient(originalRequest);
        } catch (e) {
          isRefreshing = false;
          localStorage.removeItem('token');
          localStorage.removeItem('refresh');
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
            window.location.assign('/login');
          }
          return Promise.reject(e);
        }
      } else {
        localStorage.removeItem('token');
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.assign('/login');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
