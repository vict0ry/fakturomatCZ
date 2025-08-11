import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId: number;
}

interface AuthContextType {
  user: User | null;
  sessionId: string | null;
  login: (user: User, sessionId: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateSession = async () => {
      try {
        // First try to get saved session from localStorage
        const savedSessionId = localStorage.getItem('sessionId');
        
        let sessionToTry = savedSessionId;
        
        // For development, use test session if no session exists
        if (!sessionToTry && process.env.NODE_ENV === 'development') {
          sessionToTry = 'test-session-dev';
        }
        
        if (!sessionToTry) {
          // No session found, user is not logged in
          setIsLoading(false);
          return;
        }
        
        // Validate session with server
        const response = await fetch('/api/auth/user', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${sessionToTry}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setSessionId(sessionToTry);
          
          // Save to localStorage if possible (not in incognito mode)
          try {
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('sessionId', sessionToTry);
          } catch (e) {
            // localStorage not available (incognito mode) - that's fine
            console.log('localStorage not available, using session cookies');
          }
        } else {
          // Session invalid, clear any stored data
          setUser(null);
          setSessionId(null);
          try {
            localStorage.removeItem('user');
            localStorage.removeItem('sessionId');
          } catch (e) {
            // localStorage not available - that's fine
          }
        }
      } catch (error) {
        console.error('Error validating session:', error);
        
        // Clear localStorage if possible
        try {
          localStorage.removeItem('user');
          localStorage.removeItem('sessionId');
        } catch (e) {
          // localStorage not available - that's fine
        }
      }
      
      setIsLoading(false);
    };

    validateSession();
  }, []);

  const login = (user: User, sessionId: string) => {
    setUser(user);
    setSessionId(sessionId);
    
    // Save to localStorage if possible
    try {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('sessionId', sessionId);
    } catch (e) {
      // localStorage not available (incognito mode) - that's fine
      console.log('localStorage not available during login');
    }
  };

  const logout = async () => {
    try {
      if (sessionId) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${sessionId}`,
          },
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setUser(null);
      setSessionId(null);
      
      // Clear localStorage if possible
      try {
        localStorage.removeItem('user');
        localStorage.removeItem('sessionId');
      } catch (e) {
        // localStorage not available - that's fine
      }
    }
  };

  const value = {
    user,
    sessionId,
    login,
    logout,
    isAuthenticated: !!user && !!sessionId,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}