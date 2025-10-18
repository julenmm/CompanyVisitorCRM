// Authentication service for CompanyMap
const API_BASE_URL = 'http://localhost:8000/api';

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_active?: boolean;
  date_joined?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
    this.user = this.getStoredUser();
  }

  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token and user data
      this.setToken(data.token);
      this.setUser(data.user);

      return data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    }
  }

  // Register new user
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store token and user data
      this.setToken(data.token);
      this.setUser(data.user);

      return data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      if (this.token) {
        await fetch(`${API_BASE_URL}/auth/logout/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local data regardless of API response
      this.clearAuth();
    }
  }

  // Get current user profile
  async getProfile(): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile/`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get profile');
      }

      this.setUser(data.user);
      return data.user;
    } catch (error) {
      // If profile fetch fails, clear auth data
      this.clearAuth();
      throw new Error(error instanceof Error ? error.message : 'Failed to get profile');
    }
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/request-password-reset/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request password reset');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to request password reset');
    }
  }

  // Reset password
  async resetPassword(token: string, password: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to reset password');
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.user;
  }

  // Get current token
  getToken(): string | null {
    return this.token;
  }

  // Set token
  private setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  // Set user
  private setUser(user: User): void {
    this.user = user;
    localStorage.setItem('auth_user', JSON.stringify(user));
  }

  // Get stored user from localStorage
  private getStoredUser(): User | null {
    try {
      const stored = localStorage.getItem('auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  // Clear authentication data
  private clearAuth(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }
}

// Create and export singleton instance
export const authService = new AuthService();
export default authService;
