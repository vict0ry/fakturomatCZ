import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

export function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    // Pokud není uživatel přihlášený nebo nemá admin práva, přesměruj
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      window.location.href = '/';
    }
  }, [user, isLoading, isAuthenticated]);

  // Zobraz loading během načítání
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Zobraz chybovou stránku pokud uživatel nemá oprávnění
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">🚫 Přístup odepřen</h1>
          <p className="text-gray-600 mb-4">Nemáte oprávnění k přístupu do admin panelu.</p>
          <a href="/" className="text-blue-600 hover:underline">Zpět na hlavní stránku</a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}