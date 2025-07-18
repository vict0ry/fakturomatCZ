import { useAuth } from '@/contexts/auth-context';
import { useQueryClient } from '@tanstack/react-query';

export function useAuthApi() {
  const { sessionId, logout } = useAuth();
  const queryClient = useQueryClient();

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${sessionId}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      // Session expired, logout user
      logout();
      throw new Error('Session expired');
    }

    return response;
  };

  const apiRequest = async (url: string, options: RequestInit = {}) => {
    const response = await authenticatedFetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Request failed');
    }
    
    return response.json();
  };

  const invalidateQueries = (queryKey: string | string[]) => {
    queryClient.invalidateQueries({ queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] });
  };

  return {
    authenticatedFetch,
    apiRequest,
    invalidateQueries,
  };
}