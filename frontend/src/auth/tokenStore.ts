/**
 * Memory-only token store — never persisted to localStorage/sessionStorage.
 * This prevents XSS attacks from stealing tokens.
 */

let accessToken: string | null = null;

export const tokenStore = {
  getToken: (): string | null => accessToken,

  setToken: (token: string): void => {
    accessToken = token;
  },

  clearToken: (): void => {
    accessToken = null;
  },

  hasToken: (): boolean => accessToken !== null,
};
