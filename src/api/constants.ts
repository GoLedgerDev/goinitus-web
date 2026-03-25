/** Keys used in localStorage */
export const AUTH_TOKEN_KEY = '@goinitus:authToken';
export const SERVER_URL_KEY = '@goinitus:restServer';

/**
 * In-memory sentinel value that signals the 401 flow. Never persisted to
 * localStorage — it is set transiently in globalStore state only.
 */
export const AUTH_SENTINEL = 'askForToken' as const;
