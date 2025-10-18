import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import authService, { User } from '../services/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      console.log('AuthProvider: Starting auth check');
      try {
        const isAuth = authService.isAuthenticated();
        console.log('AuthProvider: isAuthenticated =', isAuth);
        
        if (isAuth) {
          const userProfile = await authService.getProfile();
          console.log('AuthProvider: Got user profile', userProfile);
          setUser(userProfile);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear invalid auth data
        await authService.logout();
      } finally {
        console.log('AuthProvider: Setting isLoading to false');
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = () => {
    // This will be called after successful login
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};