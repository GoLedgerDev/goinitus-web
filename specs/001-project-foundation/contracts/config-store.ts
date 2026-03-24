// CONTRACT: src/store/configStore.ts
// Zustand store — server configuration and reactive Axios instance.
// This file is a TypeScript interface contract, not the implementation.

import type { AxiosInstance } from 'axios';

export interface ConfigState {
  // ── Persisted state (localStorage) ────────────────────────────────────────
  /** GoFabric REST base URL. Default: process.env.VITE_BASE_URL or '' */
  serverUrl: string;
  /** Base64-encoded Basic Auth token: "Basic <b64(user:pass)>", or null */
  authToken: string | null;

  // ── Reactive Axios instance ────────────────────────────────────────────────
  /**
   * Always-current Axios instance. Recreated whenever serverUrl or authToken
   * changes so consumers always get the up-to-date configuration without
   * needing a page reload (resolves legacy TD-06).
   */
  client: AxiosInstance;

  // ── Actions ────────────────────────────────────────────────────────────────
  /**
   * Update server URL, persist to localStorage, rebuild Axios instance.
   * Does NOT trigger a page reload.
   */
  setServerUrl: (url: string) => void;
  /**
   * Encode user + pass as Base64 Basic Auth token, persist to localStorage,
   * rebuild Axios instance.
   */
  setAuthToken: (user: string, pass: string) => void;
  /**
   * Remove auth token from state and localStorage.
   * Called on logout and on 401 with stale credentials.
   */
  clearAuthToken: () => void;

  // ── Derived helpers ────────────────────────────────────────────────────────
  /** Returns true when serverUrl is non-empty and authToken is non-null. */
  isConfigured: boolean;
}

// ── localStorage key constants (also exported from src/api/constants.ts) ────
export const SERVER_URL_KEY = '@goinitus:restServer';
export const AUTH_TOKEN_KEY = '@goinitus:authToken';
