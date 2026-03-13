import { io } from 'socket.io-client';
import { SIGNAL_SERVER_URL } from '../constants/config';

let socket;

export const getSocket = (token) => {
  if (!socket) {
    socket = io(SIGNAL_SERVER_URL, {
      transports: ['websocket'],
      withCredentials: true,
      autoConnect: false,
      reconnectionAttempts: 5,
      timeout: 10000,
      auth: {
        token: token
      }
    });
  } else if (token) {
    socket.auth = { token };
  }
  return socket;
};

export const connectSocket = (token) => {
  const s = getSocket(token);
  if (!s.connected) {
    s.connect();
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};
