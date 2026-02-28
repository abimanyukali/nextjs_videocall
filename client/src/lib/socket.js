import { io } from 'socket.io-client';
import { SIGNAL_SERVER_URL } from '../constants/config';

let socket;

export const getSocket = () => {
    if (!socket) {
        socket = io(SIGNAL_SERVER_URL, {
            autoConnect: false,
            reconnectionAttempts: 5,
            timeout: 10000,
        });
    }
    return socket;
};

export const connectSocket = () => {
    const s = getSocket();
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
