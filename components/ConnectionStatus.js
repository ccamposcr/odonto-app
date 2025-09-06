import { useState, useEffect } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const ConnectionStatus = ({ isConnected, usingFallback }) => {
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Mostrar estado solo si hay problemas de conexión o al conectar inicialmente
    if (!isConnected || usingFallback) {
      setShowStatus(true);
      
      // Ocultar después de unos segundos si la conexión se establece
      if (isConnected && !usingFallback) {
        const timer = setTimeout(() => setShowStatus(false), 3000);
        return () => clearTimeout(timer);
      }
    } else {
      setShowStatus(false);
    }
  }, [isConnected, usingFallback]);

  if (!showStatus) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 p-3 rounded-lg shadow-lg transition-all duration-300 ${
      isConnected && !usingFallback
        ? 'bg-green-100 text-green-800 border border-green-200'
        : usingFallback
        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
        : 'bg-red-100 text-red-800 border border-red-200'
    }`}>
      <div className="flex items-center space-x-2">
        {isConnected && !usingFallback ? (
          <CheckCircleIcon className="w-5 h-5" />
        ) : usingFallback ? (
          <ExclamationTriangleIcon className="w-5 h-5" />
        ) : (
          <XCircleIcon className="w-5 h-5" />
        )}
        
        <span className="text-sm font-medium">
          {isConnected && !usingFallback
            ? 'Conectado en tiempo real'
            : usingFallback
            ? 'Usando modo de compatibilidad'
            : 'Reconectando...'
          }
        </span>
      </div>
      
      {usingFallback && (
        <p className="text-xs mt-1 opacity-75">
          Las actualizaciones pueden tardar unos segundos más
        </p>
      )}
    </div>
  );
};

export default ConnectionStatus;