export const ICE_CONFIG = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
    {
      urls: 'turn:100.25.96.44:3478',
      username: 'user',
      credential: 'password',
    },
  ],
};

export const SIGNAL_SERVER_URL =
  process.env.NEXT_PUBLIC_SIGNAL_SERVER_URL ||
  'http://100.25.96.44:5000' ||
  'http://localhost:5000';
