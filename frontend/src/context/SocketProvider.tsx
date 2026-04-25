import React, { createContext, useContext } from 'react';
import type { Socket } from 'socket.io-client';
import { useSocket } from '../hooks/useSocket';
import { useCoach } from '../hooks/useCoach';
import type { CoachState, CoachStateLevel } from '../hooks/useCoach';

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
  coachState: CoachState;
  setCoachLevel: (level: CoachStateLevel) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { socket, connected } = useSocket();
  const { coachState, setCoachLevel } = useCoach(socket);

  return (
    <SocketContext.Provider value={{ socket, connected, coachState, setCoachLevel }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocketContext must be used inside <SocketProvider>');
  return ctx;
}
