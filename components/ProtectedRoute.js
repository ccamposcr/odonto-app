import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children, adminOnly = false, allowedRoles = [] }) => {
  const { isAuthenticated, isAdmin, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }

      // Si requiere admin y no es admin
      if (adminOnly && !isAdmin()) {
        router.push('/');
        return;
      }

      // Si hay roles específicos permitidos
      if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
        router.push('/');
        return;
      }
    }
  }, [isAuthenticated, isAdmin, user, loading, router, adminOnly, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dental-teal mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return null; // El useEffect se encarga de la redirección
  }

  if (adminOnly && !isAdmin()) {
    return null; // El useEffect se encarga de la redirección
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return null; // El useEffect se encarga de la redirección
  }

  return children;
};

export default ProtectedRoute;