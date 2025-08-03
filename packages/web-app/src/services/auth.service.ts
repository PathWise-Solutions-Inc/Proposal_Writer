import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

class AuthService {
  private tokenRefreshPromise: Promise<string> | null = null;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private csrfToken: string | null = null;

  constructor() {
    // Set up axios interceptors
    this.setupInterceptors();
    // Initialize tokens from storage on app load
    this.initializeTokens();
  }

  private initializeTokens() {
    // Only get refresh token from secure httpOnly cookie (handled by backend)
    // Access token should be in memory only
    this.accessToken = null;
    this.refreshToken = null;
    this.csrfToken = null;
  }

  private async getCsrfToken(): Promise<string> {
    if (!this.csrfToken) {
      const response = await axios.get(`${API_URL}/auth/csrf-token`, {
        withCredentials: true,
      });
      this.csrfToken = response.data.csrfToken;
    }
    return this.csrfToken;
  }

  private setupInterceptors() {
    // Set default axios config for cookies
    axios.defaults.withCredentials = true;

    // Request interceptor to add auth token and CSRF token
    axios.interceptors.request.use(
      async (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add CSRF token for state-changing requests
        if (config.method && ['post', 'put', 'delete', 'patch'].includes(config.method.toLowerCase())) {
          try {
            const csrfToken = await this.getCsrfToken();
            config.headers['X-CSRF-Token'] = csrfToken;
          } catch (error) {
            console.error('Failed to get CSRF token:', error);
          }
        }
        
        // Ensure cookies are sent with every request
        config.withCredentials = true;
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    }, {
      withCredentials: true, // Ensure cookies are included
    });

    if (response.data.accessToken) {
      // Store tokens in memory only, not localStorage
      this.accessToken = response.data.accessToken;
      // Refresh token is now handled by httpOnly cookie from backend
      // Store only non-sensitive user data in localStorage
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  }

  async register(data: RegisterData): Promise<void> {
    await axios.post(`${API_URL}/auth/register`, data);
  }

  async refreshAccessToken(): Promise<string> {
    // Prevent multiple simultaneous refresh requests
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    this.tokenRefreshPromise = this.performTokenRefresh();
    
    try {
      const token = await this.tokenRefreshPromise;
      return token;
    } finally {
      this.tokenRefreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<string> {
    // Refresh token is sent as httpOnly cookie automatically
    const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
      withCredentials: true,
    });

    const { accessToken } = response.data;
    
    // Store new access token in memory only
    this.accessToken = accessToken;

    return accessToken;
  }

  async logout() {
    try {
      // Call backend to clear httpOnly cookie
      await axios.post(`${API_URL}/auth/logout`, {}, {
        withCredentials: true,
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of backend response
      this.accessToken = null;
      this.refreshToken = null;
      localStorage.removeItem('user');
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Method to restore authentication state on app load
  async checkAuthStatus(): Promise<boolean> {
    try {
      // Try to refresh token using httpOnly cookie
      const token = await this.refreshAccessToken();
      return !!token;
    } catch (error) {
      return false;
    }
  }
}

export const authService = new AuthService();