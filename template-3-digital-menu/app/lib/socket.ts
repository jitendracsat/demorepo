import { io, Socket } from 'socket.io-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    console.log('[SOCKET] Creating new connection to:', API_BASE_URL);
    socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('[SOCKET] Connected. ID:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[SOCKET] Disconnected. Reason:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('[SOCKET] Connection error:', err.message);
    });

    socket.on('NEW_ORDER_RECEIVED', (data) => {
      console.log('[SOCKET] EVENT: NEW_ORDER_RECEIVED', JSON.stringify(data, null, 2));
    });

    socket.on('ORDER_STATUS_UPDATED', (data) => {
      console.log('[SOCKET] EVENT: ORDER_STATUS_UPDATED', JSON.stringify(data));
    });

    socket.on('ORDER_STATUS_CHANGED', (data) => {
      console.log('[SOCKET] EVENT: ORDER_STATUS_CHANGED', JSON.stringify(data));
    });

    socket.on('STOCK_UPDATED', (data) => {
      console.log('[SOCKET] EVENT: STOCK_UPDATED — sold out items:', data?.length || 0);
    });
  }
  return socket;
};
