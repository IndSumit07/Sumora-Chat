import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import { getPubClient, getSubClient } from '../config/redis.js';
import { initSocketService } from '../services/socket.service.js';
import { joinUserRooms, leaveAllRooms } from './rooms.js';
import { registerMessageHandlers } from './handlers/message.handler.js';
import { registerTypingHandlers } from './handlers/typing.handler.js';
import { registerPresenceHandlers } from './handlers/presence.handler.js';
import { registerGroupHandlers } from './handlers/group.handler.js';
import User from '../models/User.js';
import logger from '../config/logger.js';

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [
        process.env.FRONTEND_URL,
        'https://sumora-chat-qzia.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000',
      ].filter(Boolean),
      credentials: true,
      methods: ['GET', 'POST'],
    },
    // Start with polling so the connection works even if Nginx doesn't proxy WebSocket,
    // then it will automatically try to upgrade to WebSocket
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e7, // 10MB max payload
  });

  // Redis adapter for PM2 cluster mode
  const pubClient = getPubClient();
  const subClient = getSubClient();
  io.adapter(createAdapter(pubClient, subClient));

  // Initialize socket service with io instance
  initSocketService(io);

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      } catch (err) {
        return next(new Error('Invalid or expired token'));
      }

      const user = await User.findById(decoded.userId)
        .select('_id fullName username avatar friends isDeleted isVerified')
        .lean();

      if (!user || user.isDeleted || !user.isVerified) {
        return next(new Error('User not found or unauthorized'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (err) {
      logger.error(`Socket auth error: ${err.message}`);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    logger.info(`Socket connected: userId=${userId}, socketId=${socket.id}`);

    try {
      // Join all relevant rooms
      await joinUserRooms(socket, io);

      // Register event handlers
      registerPresenceHandlers(socket, io);
      registerMessageHandlers(socket, io);
      registerTypingHandlers(socket, io);
      registerGroupHandlers(socket, io);

      // Handle disconnect
      socket.on('disconnect', async (reason) => {
        logger.info(`Socket disconnected: userId=${userId}, reason=${reason}`);
        await leaveAllRooms(socket, io);
      });

      // Handle errors
      socket.on('error', (err) => {
        logger.error(`Socket error: userId=${userId}, error=${err.message}`);
      });

    } catch (err) {
      logger.error(`Socket connection setup error: ${err.message}`);
      socket.disconnect(true);
    }
  });

  logger.info('Socket.IO server initialized with Redis adapter');
  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

export default initSocket;
