// Funciones auxiliares para emitir eventos de socket
export const emitCitasUpdate = (res) => {
  if (res.socket?.server?.io) {
    res.socket.server.io.to('citas-room').emit('citas-updated');
  }
};

export const emitBlockedDaysUpdate = (res) => {
  if (res.socket?.server?.io) {
    res.socket.server.io.to('citas-room').emit('blocked-days-updated');
  }
};

export const emitExpedientesUpdate = (res) => {
  if (res.socket?.server?.io) {
    res.socket.server.io.to('expedientes-room').emit('expedientes-updated');
  }
};

export const emitConfigUpdate = (res) => {
  if (res.socket?.server?.io) {
    res.socket.server.io.to('config-room').emit('config-updated');
  }
};