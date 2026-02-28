export const ICE_CONFIG = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
    {
      urls: 'turn:54.242.142.48:3478',
      username: 'user',
      credential: 'password',
    },
  ],
};

export const SIGNAL_SERVER_URL =
  process.env.NEXT_PUBLIC_SIGNAL_SERVER_URL ||
  'http://54.242.142.48:5000' ||
  'http://localhost:5000';
