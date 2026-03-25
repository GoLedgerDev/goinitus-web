import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AUTH_TOKEN_KEY, SERVER_URL_KEY } from '@/api/constants';

interface ConfigState {
  serverUrl: string;
  authToken: string | null;
  client: AxiosInstance;
  isConfigured: boolean;
  setServerUrl: (url: string) => void;
  setAuthToken: (user: string, pass: string) => void;
  clearAuthToken: () => void;
}

function makeClient(url: string, token: string | null): AxiosInstance {
  const instance = axios.create({ baseURL: url });
  if (token) {
    instance.defaults.headers.common['Authorization'] = token;
  }
  // Sanitise error responses before logging — never leak credentials (Constitution §IV)
  instance.interceptors.response.use(
    (response) => response,
    (err: AxiosError) => {
      const sanitised = {
        status: err.response?.status,
        url: err.config?.url,
        method: err.config?.method,
      };
      console.error('[api error]', sanitised);
      return Promise.reject(err);
    },
  );
  return instance;
}

const defaultUrl = localStorage.getItem(SERVER_URL_KEY) ?? import.meta.env.VITE_BASE_URL ?? '';
const defaultToken = localStorage.getItem(AUTH_TOKEN_KEY) ?? null;

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      serverUrl: defaultUrl,
      authToken: defaultToken,
      client: makeClient(defaultUrl, defaultToken),
      isConfigured: Boolean(defaultUrl && defaultToken),

      setServerUrl: (url: string) => {
        const token = get().authToken;
        localStorage.setItem(SERVER_URL_KEY, url);
        set({ serverUrl: url, client: makeClient(url, token), isConfigured: Boolean(url && token) });
      },

      setAuthToken: (user: string, pass: string) => {
        const token = `Basic ${btoa(`${user}:${pass}`)}`;
        const url = get().serverUrl;
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        set({ authToken: token, client: makeClient(url, token), isConfigured: Boolean(url && token) });
      },

      clearAuthToken: () => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        const url = get().serverUrl;
        set({ authToken: null, client: makeClient(url, null), isConfigured: false });
      },
    }),
    {
      name: 'goinitus-config',
      // Only persist the raw values — client (AxiosInstance) must be recreated on hydration
      partialize: (state) => ({
        serverUrl: state.serverUrl,
        authToken: state.authToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.client = makeClient(state.serverUrl, state.authToken);
          state.isConfigured = Boolean(state.serverUrl && state.authToken);
        }
      },
    },
  ),
);
