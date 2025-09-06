import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

// Conexión global singleton
let globalSocket = null;
let isInitializing = false;

const getSocket = () => {
  if (globalSocket?.connected) {
    return globalSocket;
  }
  
  if (!isInitializing) {
    isInitializing = true;
    
    // Simple inicialización sin fetch adicional
    globalSocket = io({
      path: '/api/socketio',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: 3
    });

    globalSocket.on('connect', () => {
      console.log('✅ Socket connected:', globalSocket.id, 'Transport:', globalSocket.io.engine.transport.name);
      isInitializing = false;
    });

    globalSocket.on('upgrade', () => {
      console.log('⬆️ Socket upgraded to:', globalSocket.io.engine.transport.name);
    });

    globalSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      isInitializing = false;
    });

    globalSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });
  }
  
  return globalSocket;
};

const useSimpleSocket = (eventHandlers = {}) => {
  const socketRef = useRef();
  const handlersRef = useRef([]);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    // Limpiar handlers anteriores
    handlersRef.current.forEach(({ event, handler }) => {
      socket.off(event, handler);
    });
    handlersRef.current = [];

    // Agregar nuevos handlers
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      if (handler && typeof handler === 'function') {
        const wrappedHandler = () => {
          console.log(`Received ${event} via socket`);
          handler();
        };
        
        socket.on(event, wrappedHandler);
        handlersRef.current.push({ event, handler: wrappedHandler });
      }
    });

    return () => {
      // Solo limpiar handlers específicos de este hook
      handlersRef.current.forEach(({ event, handler }) => {
        socket.off(event, handler);
      });
    };
  }, Object.values(eventHandlers));

  return socketRef.current;
};

export default useSimpleSocket;