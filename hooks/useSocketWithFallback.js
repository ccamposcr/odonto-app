import { useState, useEffect } from 'react';
import useSocket from './useSocket';

const useSocketWithFallback = (eventHandlers = {}) => {
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [usePolling, setUsePolling] = useState(false);

  // Intentar usar WebSocket primero
  const socket = useSocket({
    ...eventHandlers,
    // Agregar handlers para monitorear el estado de conexión
    connect: () => {
      console.log('Socket connected successfully');
      setIsSocketConnected(true);
      setUsePolling(false);
    },
    disconnect: () => {
      console.log('Socket disconnected');
      setIsSocketConnected(false);
    },
    connect_error: () => {
      console.log('Socket connection failed, falling back to polling');
      setIsSocketConnected(false);
      setUsePolling(true);
    }
  });

  // Fallback a polling si WebSocket falla
  useEffect(() => {
    if (!usePolling) return;

    console.log('Using polling fallback for real-time updates');
    
    const pollForUpdates = async () => {
      try {
        // Solo hacer polling si WebSocket no está funcionando
        if (!isSocketConnected) {
          const response = await fetch('/api/sync-status');
          if (response.ok) {
            const syncData = await response.json();
            // Simular eventos de socket con polling
            Object.keys(eventHandlers).forEach(eventName => {
              const handler = eventHandlers[eventName];
              if (handler && typeof handler === 'function') {
                handler();
              }
            });
          }
        }
      } catch (error) {
        console.error('Polling fallback error:', error);
      }
    };

    // Verificar cada 5 segundos si WebSocket sigue fallando
    const interval = setInterval(pollForUpdates, 5000);

    return () => clearInterval(interval);
  }, [usePolling, isSocketConnected, eventHandlers]);

  return {
    socket,
    isConnected: isSocketConnected,
    usingFallback: usePolling
  };
};

export default useSocketWithFallback;