import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';

export type CoachStateLevel = 0 | 1 | 2;

export interface CoachState {
  level: CoachStateLevel;
  label: string;
  color: string;
  borderColor: string;
  tone: string;
}

const COACH_STATES: Record<CoachStateLevel, CoachState> = {
  0: {
    level: 0,
    label: 'Gentle',
    color: '#00FF87',
    borderColor: 'rgba(0,255,135,0.3)',
    tone: 'Encouraging and supportive — you\'re doing great!',
  },
  1: {
    level: 1,
    label: 'Firm',
    color: '#FFB347',
    borderColor: 'rgba(255,179,71,0.4)',
    tone: 'Data-driven and direct — the numbers don\'t lie.',
  },
  2: {
    level: 2,
    label: 'Blunt',
    color: '#FF6B6B',
    borderColor: 'rgba(255,107,107,0.5)',
    tone: 'No-nonsense — this pattern is actively hurting your future.',
  },
};

interface UseCoachReturn {
  coachState: CoachState;
  setCoachLevel: (level: CoachStateLevel) => void;
}

export function useCoach(socket: Socket | null): UseCoachReturn {
  const [level, setLevel] = useState<CoachStateLevel>(0);

  useEffect(() => {
    if (!socket) return;

    const handleStateChange = (data: { state: CoachStateLevel }) => {
      if (data.state === 0 || data.state === 1 || data.state === 2) {
        setLevel(data.state);
      }
    };

    socket.on('coach:state-changed', handleStateChange);
    return () => { socket.off('coach:state-changed', handleStateChange); };
  }, [socket]);

  return {
    coachState: COACH_STATES[level],
    setCoachLevel: setLevel,
  };
}
