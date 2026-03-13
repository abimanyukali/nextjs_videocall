import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import CallLog from '../models/CallLog.js';

const connectedUsers = new Map(); // socket.id -> { userId, socket, roomId }
const waitingQueue = []; // Array of { userId, socket }
const activeRooms = new Map(); // roomId -> { user1, user2, callLogId, callTimer }

// Max call duration in seconds (1 minute)
const MAX_CALL_DURATION_SECONDS = 60;

export const initializeSocket = (io) => {
    // Middleware for Socket Authentication
    io.use(async (socket, next) => {
        try {
            let token;
            if (socket.handshake.auth && socket.handshake.auth.token && socket.handshake.auth.token !== 'use-cookie') {
                token = socket.handshake.auth.token;
            } else if (socket.request.headers.cookie) {
                const cookies = socket.request.headers.cookie.split(';');
                for (let cookie of cookies) {
                    const [name, value] = cookie.trim().split('=');
                    if (name === 'accessToken') {
                        token = value;
                        break;
                    }
                }
            }

            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select('-password');

            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }

            socket.user = user;
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.user.name} (${socket.id})`);

        connectedUsers.set(socket.id, {
            userId: socket.user._id.toString(),
            socket: socket,
            roomId: null,
        });

        socket.on('join', () => {
            try {
                joinQueue(socket, io);
            } catch (err) {
                console.error('Error during JOIN:', err);
                socket.emit('error', 'Failed to join the matching queue.');
            }
        });

        socket.on('signal', (data) => {
            try {
                if (!data.roomId || !data.signal) return;
                const signalType = data.signal.type || (data.signal.candidate ? 'candidate' : 'unknown');
                console.log(`[WebRTC SIGNAL] User ${socket.id} sent ${signalType} to room ${data.roomId}`);
                socket.to(data.roomId).emit('signal', {
                    roomId: data.roomId,
                    signal: data.signal,
                    from: socket.id,
                });
            } catch (err) {
                console.error('Signal Error:', err);
            }
        });

        socket.on('skip', async () => {
            try {
                console.log('Skip requested by:', socket.user.name);
                await cleanupUser(socket, io);
                // Re-add to connected set after cleanup removed it
                connectedUsers.set(socket.id, {
                    userId: socket.user._id.toString(),
                    socket: socket,
                    roomId: null,
                });
                joinQueue(socket, io);
            } catch (err) {
                console.error('Skip Error:', err);
            }
        });

        socket.on('report', async (data) => {
            try {
                console.log(`User ${socket.user._id} reported peer in room ${data.roomId}`);
                await cleanupUser(socket, io);
                socket.emit('reported-success');
            } catch (err) {
                console.error('Report Error:', err);
            }
        });

        socket.on('block', async (data) => {
            try {
                console.log(`User ${socket.user._id} blocked peer in room ${data.roomId}`);
                await cleanupUser(socket, io);
                socket.emit('blocked-success');
            } catch (err) {
                console.error('Block Error:', err);
            }
        });

        socket.on('disconnect-call', async () => {
            try {
                await cleanupUser(socket, io);
            } catch (err) {
                console.error('Disconnect Call Error:', err);
            }
        });

        socket.on('ping-test', () => {
            socket.emit('pong-test');
        });

        socket.on('disconnect', async (reason) => {
            console.log(`Disconnect: ${socket.user.name} (${socket.id}), Reason: ${reason}`);
            await cleanupUser(socket, io, true);
        });

        socket.on('error', (err) => {
            console.error(`Socket error [${socket.id}]:`, err);
        });
    });
};

async function joinQueue(socket, io) {
    const currentUserId = socket.user._id.toString();

    // Prevent duplicate queuing
    if (waitingQueue.some((u) => u.socket.id === socket.id)) return;

    // Prevent user from joining if they are already in a room
    const userInfo = connectedUsers.get(socket.id);
    if (userInfo && userInfo.roomId) return;

    // Find a suitable peer (not the same user)
    let peerIndex = -1;
    for (let i = 0; i < waitingQueue.length; i++) {
        if (waitingQueue[i].userId !== currentUserId) {
            peerIndex = i;
            break;
        }
    }

    if (peerIndex !== -1) {
        const peer = waitingQueue.splice(peerIndex, 1)[0];
        const peerSocket = peer.socket;

        // Safety check: ensure peer is still connected
        if (!io.sockets.sockets.get(peerSocket.id)) {
            return joinQueue(socket, io);
        }

        const roomId = `room-${socket.id}-${peerSocket.id}`;

        // Create Call Log in DB
        const newCallLog = await CallLog.create({
            callerId: currentUserId,
            receiverId: peer.userId,
        });

        // Check premium status (re-fetch to get up-to-date info)
        const currentUserPremium = socket.user.isPremium &&
            socket.user.premiumExpiry &&
            new Date(socket.user.premiumExpiry) > new Date();
        const peerUserPremium = peerSocket.user.isPremium &&
            peerSocket.user.premiumExpiry &&
            new Date(peerSocket.user.premiumExpiry) > new Date();

        activeRooms.set(roomId, {
            user1: { userId: currentUserId, socketId: socket.id },
            user2: { userId: peer.userId, socketId: peerSocket.id },
            callLogId: newCallLog._id,
            callTimer: null,
        });

        // Update user info with roomId
        connectedUsers.get(socket.id).roomId = roomId;
        connectedUsers.get(peerSocket.id).roomId = roomId;

        socket.join(roomId);
        peerSocket.join(roomId);

        // Emit paired event with premium status
        socket.emit('paired', {
            roomId,
            peerId: peerSocket.id,
            peerUser: { name: peerSocket.user.name, id: peerSocket.user._id },
            isPremium: currentUserPremium,
        });
        peerSocket.emit('paired', {
            roomId,
            peerId: socket.id,
            peerUser: { name: socket.user.name, id: socket.user._id },
            isPremium: peerUserPremium,
        });

        console.log(`Paired: [${socket.user.name}] <-> [${peerSocket.user.name}] in [${roomId}]`);

        // ✅ Start 60-second call timer — auto-end after MAX_CALL_DURATION_SECONDS
        const callTimer = setTimeout(async () => {
            console.log(`[Timer] Room ${roomId} exceeded ${MAX_CALL_DURATION_SECONDS}s — auto-ending call.`);
            const room = activeRooms.get(roomId);
            if (!room) return;

            // Notify both users that call time is up
            io.to(roomId).emit('call-time-up', {
                message: `Call ended after ${MAX_CALL_DURATION_SECONDS} seconds. Upgrade to Premium for longer calls!`,
            });

            // Cleanup the room
            await endRoom(roomId, io);
        }, MAX_CALL_DURATION_SECONDS * 1000);

        // Store timer reference so we can clear it on manual disconnect
        const roomData = activeRooms.get(roomId);
        if (roomData) roomData.callTimer = callTimer;

    } else {
        waitingQueue.push({ userId: currentUserId, socket: socket });
        socket.emit('waiting');
        console.log(`Waiting: [${socket.user.name}] added to queue.`);
    }
}

// End a specific room — used by auto-timer and manual cleanup
async function endRoom(roomId, io) {
    const room = activeRooms.get(roomId);
    if (!room) return;

    // Clear any pending call timer
    if (room.callTimer) {
        clearTimeout(room.callTimer);
        room.callTimer = null;
    }

    // Update Call Log
    if (room.callLogId) {
        try {
            const log = await CallLog.findById(room.callLogId);
            if (log && !log.endTime) {
                const endTime = new Date();
                const duration = Math.round((endTime - log.startTime) / 1000);
                log.endTime = endTime;
                log.duration = duration;
                await log.save();
            }
        } catch (dbErr) {
            console.error('Failed to update call log duration:', dbErr);
        }
    }

    const user1Socket = io.sockets.sockets.get(room.user1.socketId);
    const user2Socket = io.sockets.sockets.get(room.user2.socketId);

    // Clean up user1
    if (user1Socket) {
        user1Socket.emit('peer-disconnected');
        user1Socket.leave(roomId);
        const u1Info = connectedUsers.get(room.user1.socketId);
        if (u1Info) u1Info.roomId = null;
    }

    // Clean up user2
    if (user2Socket) {
        user2Socket.emit('peer-disconnected');
        user2Socket.leave(roomId);
        const u2Info = connectedUsers.get(room.user2.socketId);
        if (u2Info) u2Info.roomId = null;
    }

    activeRooms.delete(roomId);
    console.log(`Room [${roomId}] closed.`);
}

async function cleanupUser(socket, io, completeDisconnect = false) {
    const userInfo = connectedUsers.get(socket.id);

    // 1. Remove from waiting queue
    const queueIndex = waitingQueue.findIndex((u) => u.socket.id === socket.id);
    if (queueIndex !== -1) {
        waitingQueue.splice(queueIndex, 1);
    }

    if (completeDisconnect) {
        connectedUsers.delete(socket.id);
    } else if (userInfo) {
        userInfo.roomId = null;
    }

    // 2. Close active room and notify peers
    if (userInfo && userInfo.roomId) {
        const roomId = userInfo.roomId;
        const room = activeRooms.get(roomId);

        if (room) {
            // Clear call timer
            if (room.callTimer) {
                clearTimeout(room.callTimer);
                room.callTimer = null;
            }

            // Update Call Log
            if (room.callLogId) {
                try {
                    const log = await CallLog.findById(room.callLogId);
                    if (log && !log.endTime) {
                        const endTime = new Date();
                        const duration = Math.round((endTime - log.startTime) / 1000);
                        log.endTime = endTime;
                        log.duration = duration;
                        await log.save();
                    }
                } catch (dbErr) {
                    console.error('Failed to update call log duration:', dbErr);
                }
            }

            const peerId = room.user1.socketId === socket.id ? room.user2.socketId : room.user1.socketId;
            const peerSocket = io.sockets.sockets.get(peerId);

            if (peerSocket) {
                peerSocket.emit('peer-disconnected');
                peerSocket.leave(roomId);

                const peerUserInfo = connectedUsers.get(peerId);
                if (peerUserInfo) peerUserInfo.roomId = null;
            }

            socket.leave(roomId);
            activeRooms.delete(roomId);
            console.log(`Room [${roomId}] closed. Peer [${peerId}] notified.`);
        }
    }
}
