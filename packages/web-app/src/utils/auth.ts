/**
 * Get the authentication token from localStorage
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

/**
 * Set the authentication token in localStorage
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem('accessToken', token);
};

/**
 * Remove the authentication token from localStorage
 */
export const clearAuthToken = (): void => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

/**
 * Get the refresh token from localStorage
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refreshToken');
};

/**
 * Set the refresh token in localStorage
 */
export const setRefreshToken = (token: string): void => {
  localStorage.setItem('refreshToken', token);
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};