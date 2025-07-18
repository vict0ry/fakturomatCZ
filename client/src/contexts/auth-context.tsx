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
    // Check for existing session in localStorage
    const savedUser = localStorage.getItem('user');
    const savedSessionId = localStorage.getItem('sessionId');
    
    if (savedUser && savedSessionId) {
      try {
        setUser(JSON.parse(savedUser));
        setSessionId(savedSessionId);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('sessionId');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = (user: User, sessionId: string) => {
    setUser(user);
    setSessionId(sessionId);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('sessionId', sessionId);
  };

  const logout = async () => {
    try {
      if (sessionId) {
        await fetch('/api/auth/logout', {
          method: 'POST',
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
      localStorage.removeItem('user');
      localStorage.removeItem('sessionId');
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