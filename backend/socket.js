import { Server } from 'socket.io';

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 KDS client connected: ${socket.id}`);
    socket.on('disconnect', () => {
      console.log(`🔌 KDS client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => io;
