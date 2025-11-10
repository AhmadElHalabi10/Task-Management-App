import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    // Remove /api suffix for socket connection
    const socketUrl = apiUrl.replace('/api', '');
    socket = io(socketUrl);
  }
  return socket;
};

export default getSocket;
