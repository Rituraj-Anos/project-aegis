import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let io: Server;

export function initializeSockets(server: HttpServer): void {
  io = new Server(server, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('auth', (data: { token: string }) => {
      try {
        const decoded = jwt.verify(data.token, env.JWT_ACCESS_SECRET) as { _id: string };
        socket.join(`user:${decoded._id}`);
        socket.emit('auth:success');
        logger.info(`Socket ${socket.id} authenticated as user ${decoded._id}`);
      } catch (err) {
        socket.emit('auth:error', 'Invalid token');
        logger.error(`Socket ${socket.id} authentication failed`);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });

    socket.on('transaction:submit', async (data: any) => {
      try {
        const decodedId = Array.from(socket.rooms).find(r => r !== socket.id);
        if (!decodedId) return;

        // Use AI to generate intercept message if budget exceeded
        const { generateAiInsight } = await import('../modules/analytics/analytics.service.js');
        const aiResponse = await generateAiInsight(decodedId, {
          type: 'coach_alert',
          amount: data.amount,
          category: data.category || 'Shopping',
          coachState: data.coachState || 1,
          weeklySpend: data.weeklySpend || 15000,
        });

        const tone = data.coachState === 2 ? 'blunt' : data.coachState === 1 ? 'firm' : 'gentle';
        
        socket.emit('coach:alert', {
          _id: new Date().getTime().toString(),
          amount: data.amount,
          description: `Intercepted · ${data.category || 'Shopping'}`,
          coachState: data.coachState || 1,
          tone,
          message: aiResponse.insight,
          shadowInsight: `₹${data.amount} invested = compound growth!`,
          projectedSIP: data.amount * 10,
          projectedFD: data.amount * 6,
          projectedInflationAdj: data.amount * 5,
        });
      } catch (err) {
        logger.error('Error generating AI coach alert:', err);
      }
    });
  });

  logger.info('🔌 Socket.io initialized');
}

export function emitToUser(userId: string, event: string, data: unknown): void {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}
