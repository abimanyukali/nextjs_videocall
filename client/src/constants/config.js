export const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:abimanyuresearchlab.online:3478?transport=udp',
      username: 'user',
      credential: 'password',
    },
    {
      urls: 'turns:abimanyuresearchlab.online:5349?transport=tcp',
      username: 'user',
      credential: 'password',
    },
  ],
  iceTransportPolicy: 'all',
};

export const SIGNAL_SERVER_URL =
  process.env.NEXT_PUBLIC_SIGNAL_SERVER_URL || ' /';
