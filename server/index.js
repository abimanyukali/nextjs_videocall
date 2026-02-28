import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Security: Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

app.use(limiter);
const allowedOrigins = [
  'https://686dffq3-3000.inc1.devtunnels.ms',
  'http://localhost:3000',
  'https://localhost:3000',
  'https://192.168.1.33:3000',
  'http://3.80.201.5:3000',
  'https://3.80.201.5:3000',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

/**
 * User Store & Queue Management
 * Strictly maintain a set of connected users and a single waiting queue.
 */
const connectedUsers = new Set();
const waitingQueue = []; // Array of socket IDs
const activeRooms = new Map(); // roomId -> { user1, user2 }

function cleanupUser(socketId) {
  // 1. Remove from connected users set
  connectedUsers.delete(socketId);

  // 2. Remove from waiting queue
  const queueIndex = waitingQueue.indexOf(socketId);
  if (queueIndex !== -1) {
    waitingQueue.splice(queueIndex, 1);
  }

  // 3. Close active rooms and notify peers
  for (const [roomId, room] of activeRooms.entries()) {
    if (room.user1 === socketId || room.user2 === socketId) {
      const peerId = room.user1 === socketId ? room.user2 : room.user1;
      const peerSocket = io.sockets.sockets.get(peerId);

      if (peerSocket) {
        peerSocket.emit('peer-disconnected');
        peerSocket.leave(roomId);
        // Automatically re-queue the peer if they are still connected
        setTimeout(() => joinQueue(peerSocket), 1000);
      }

      activeRooms.delete(roomId);
      console.log(`Room [${roomId}] closed. Peer [${peerId}] notified.`);
    }
  }
}

function joinQueue(socket) {
  // Prevent duplicate queuing or pairing
  if (waitingQueue.includes(socket.id)) return;

  // Check if already in a room
  for (const room of activeRooms.values()) {
    if (room.user1 === socket.id || room.user2 === socket.id) return;
  }

  if (waitingQueue.length > 0) {
    const peerId = waitingQueue.shift();

    // Safety check: ensure peer is still connected
    const peerSocket = io.sockets.sockets.get(peerId);
    if (!peerSocket) {
      // If peer is gone, try matching with next in queue
      return joinQueue(socket);
    }

    const roomId = `room-${socket.id}-${peerId}`;
    activeRooms.set(roomId, { user1: socket.id, user2: peerId });

    socket.join(roomId);
    peerSocket.join(roomId);

    socket.emit('paired', { roomId, peerId: peerId });
    peerSocket.emit('paired', { roomId, peerId: socket.id });

    console.log(`Paired: [${socket.id}] <-> [${peerId}] in [${roomId}]`);
  } else {
    waitingQueue.push(socket.id);
    socket.emit('waiting');
    console.log(`Waiting: [${socket.id}] added to queue.`);
  }
}

io.on('connection', (socket) => {
  console.log('Connect:', socket.id);
  connectedUsers.add(socket.id);

  socket.on('join', () => {
    try {
      joinQueue(socket);
    } catch (err) {
      console.error('Error during JOIN:', err);
      socket.emit('error', 'Failed to join the matching queue.');
    }
  });

  socket.on('signal', (data) => {
    try {
      if (!data.roomId || !data.signal) return;
      socket.to(data.roomId).emit('signal', {
        roomId: data.roomId,
        signal: data.signal,
        from: socket.id,
      });
    } catch (err) {
      console.error('Signal Error:', err);
    }
  });

  socket.on('skip', () => {
    try {
      console.log('Skip requested by:', socket.id);
      cleanupUser(socket.id);
      connectedUsers.add(socket.id); // Re-add to connected set
      joinQueue(socket);
    } catch (err) {
      console.error('Skip Error:', err);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('Disconnect:', socket.id, `Reason: ${reason}`);
    cleanupUser(socket.id);
  });

  // Handle errors
  socket.on('error', (err) => {
    console.error(`Socket error [${socket.id}]:`, err);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server live on port ${PORT}`);
});
