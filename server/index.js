import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from './config/passport.js';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { initializeSocket } from './services/socketService.js';

connectDB();

const app = express();
app.use(express.json());
app.use(cookieParser());

// Passport & Session initialization
app.use(
  session({
    secret: process.env.JWT_SECRET || 'fallback_secret',
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

const allowedOrigins = [
  'https://686dffq3-3000.inc1.devtunnels.ms',
  'https://686dffq3-3000.inc1.devtunnels.ms/',
  'https://abimanyuresearchlab.online/',
  'http://localhost:3000',
  'https://localhost:3000',
  'http://127.0.0.1:3000',
  'https://192.168.1.33:3000',
  'http://192.168.1.33:3000',
  'http://34.198.25.152:3000',
  'https://34.198.25.152:3000',
  'https://nextjs-videocall-frontend.vercel.app',
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

// Security: Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

app.use(limiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/payment', paymentRoutes);

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingInterval: 20000,
  pingTimeout: 60000,
});

// Initialize Socket Signaling
initializeSocket(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server live on port ${PORT}`);
});
