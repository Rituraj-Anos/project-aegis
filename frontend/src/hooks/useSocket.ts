import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { env } from '../lib/env';
import { tokenStore } from '../auth/tokenStore';

interface UseSocketReturn {
  socket: Socket | null;
  connected: boolean;
  error: string | null;
}

export function useSocket(): UseSocketReturn {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!env.VITE_ENABLE_REAL_TIME) return;

    const socket = io(env.VITE_API_BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setError(null);
      // Authenticate immediately after connect
      const token = tokenStore.getToken();
      if (token) socket.emit('auth', { token });
    });

    socket.on('auth:success', () => {
      // Auth confirmed by server
    });

    socket.on('auth:error', (msg: string) => {
      setError(`Auth failed: ${msg}`);
      socket.disconnect();
    });

    socket.on('disconnect', (reason) => {
      setConnected(false);
      if (reason === 'io server disconnect') {
        // Server forced disconnect — don't auto-reconnect
        setError('Disconnected by server.');
      }
    });

    socket.on('connect_error', (err) => {
      setError(err.message);
    });

    return () => {
      socket.off('connect');
      socket.off('auth:success');
      socket.off('auth:error');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return { socket: socketRef.current, connected, error };
}
