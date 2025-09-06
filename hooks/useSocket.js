import { useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';

// Singleton para la conexión Socket.IO
let globalSocket = null;
let initializationPromise = null;

let serverInitialized = false;

const initializeSocket = async () => {
  if (globalSocket?.connected) {
    return globalSocket;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      // Solo inicializar el servidor una vez en toda la aplicación
      if (!serverInitialized) {
        await fetch('/api/socket');
        serverInitialized = true;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (globalSocket) {
        globalSocket.disconnect();
      }
      
      globalSocket = io({
        path: '/api/socketio',
        transports: ['polling', 'websocket'],
        forceNew: false,
        autoConnect: true
      });

      return globalSocket;
    } catch (error) {
      initializationPromise = null;
      throw error;
    }
  })();

  return initializationPromise;
};

const useSocket = (eventHandlers = {}) => {
  const socketRef = useRef();
  const handlersRef = useRef(eventHandlers);
  
  // Actualizar handlers si cambian
  handlersRef.current = eventHandlers;

  const initSocket = useCallback(async () => {
    try {
      const socket = await initializeSocket();
      socketRef.current = socket;

      // Configurar event handlers dinámicamente
      Object.entries(handlersRef.current).forEach(([event, handler]) => {
        if (handler && typeof handler === 'function') {
          // Remover listener anterior si existe
          socketRef.current.off(event, handler);
          socketRef.current.on(event, () => {
            console.log(`Received ${event} via socket`);
            handler();
          });
        }
      });

    } catch (error) {
      console.error('Failed to initialize socket:', error);
    }
  }, []);

  useEffect(() => {
    initSocket();

    // Cleanup en unmount - solo remover handlers específicos, no desconectar socket global
    return () => {
      if (socketRef.current) {
        Object.keys(handlersRef.current).forEach(event => {
          socketRef.current.off(event);
        });
      }
    };
  }, [initSocket]);

  return socketRef.current;
};

export default useSocket;