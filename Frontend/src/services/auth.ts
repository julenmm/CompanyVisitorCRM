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

export interface OAuthResponse {
  message: string;
  user: User;
  session: {
    token: string;
    expires_at: string;
  };
}

export interface OAuthUrls {
  google?: {
    client_id: string;
    redirect_uri: string;
  };
  facebook?: {
    client_id: string;
    redirect_uri: string;
  };
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

  // OAuth Methods
  
  // Get OAuth provider URLs
  async getOAuthUrls(): Promise<OAuthUrls> {
    try {
      const response = await fetch(`${API_BASE_URL}/oauth/urls/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get OAuth URLs');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting OAuth URLs:', error);
      throw error;
    }
  }

  // Google OAuth login
  async loginWithGoogle(accessToken: string): Promise<OAuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/oauth/google/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token: accessToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Google login failed');
      }

      const data: OAuthResponse = await response.json();
      
      // Store authentication data
      this.setToken(data.session.token);
      this.setUser(data.user);
      
      return data;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  // Facebook OAuth login
  async loginWithFacebook(accessToken: string): Promise<OAuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/oauth/facebook/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token: accessToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Facebook login failed');
      }

      const data: OAuthResponse = await response.json();
      
      // Store authentication data
      this.setToken(data.session.token);
      this.setUser(data.user);
      
      return data;
    } catch (error) {
      console.error('Facebook login error:', error);
      throw error;
    }
  }

  // Helper method to initiate Google OAuth flow
  async initiateGoogleLogin(): Promise<void> {
    try {
      const urls = await this.getOAuthUrls();
      if (!urls.google) {
        throw new Error('Google OAuth not configured');
      }

      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${urls.google.client_id}&` +
        `redirect_uri=${encodeURIComponent(urls.google.redirect_uri)}&` +
        `response_type=code&` +
        `scope=email profile&` +
        `access_type=offline&` +
        `prompt=consent`;

      window.location.href = googleAuthUrl;
    } catch (error) {
      console.error('Error initiating Google login:', error);
      throw error;
    }
  }

  // Helper method to initiate Facebook OAuth flow
  async initiateFacebookLogin(): Promise<void> {
    try {
      const urls = await this.getOAuthUrls();
      if (!urls.facebook) {
        throw new Error('Facebook OAuth not configured');
      }

      const facebookAuthUrl = `https://www.facebook.com/v13.0/dialog/oauth?` +
        `client_id=${urls.facebook.client_id}&` +
        `redirect_uri=${encodeURIComponent(urls.facebook.redirect_uri)}&` +
        `response_type=code&` +
        `scope=email,public_profile`;

      window.location.href = facebookAuthUrl;
    } catch (error) {
      console.error('Error initiating Facebook login:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
export const authService = new AuthService();
export default authService;
