import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
  if (!io) {
    io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.BASE_URL 
          : ['http://localhost:3000', 'http://127.0.0.1:3000'],
        methods: ['GET', 'POST']
      }
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // El cliente se une a la sala de citas para recibir actualizaciones
      socket.join('citas-room');

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    console.log('Socket.IO server initialized');
  }

  return io;
};

export const getSocket = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initSocket first.');
  }
  return io;
};

// Funciones para emitir eventos de actualización
export const emitCitasUpdate = () => {
  if (io) {
    io.to('citas-room').emit('citas-updated');
  }
};

export const emitBlockedDaysUpdate = () => {
  if (io) {
    io.to('citas-room').emit('blocked-days-updated');
  }
};