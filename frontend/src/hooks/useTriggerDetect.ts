import { useEffect, useState } from 'react';

export interface TriggerInfo {
  riskScore: number;
  activeTriggers: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

function computeRisk(): TriggerInfo {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0=Sun, 6=Sat
  const date = now.getDate();

  let riskScore = 0;
  const activeTriggers: string[] = [];

  // Late night: 10pm – 5am
  if (hour >= 22 || hour <= 5) {
    riskScore += 30;
    activeTriggers.push('late_night');
  }

  // Weekend
  if (day === 0 || day === 6) {
    riskScore += 20;
    activeTriggers.push('weekend');
  }

  // End of month
  if (date >= 25) {
    riskScore += 25;
    activeTriggers.push('end_of_month');
  }

  const riskLevel: TriggerInfo['riskLevel'] =
    riskScore >= 50 ? 'high' : riskScore >= 20 ? 'medium' : 'low';

  return { riskScore: Math.min(riskScore, 100), activeTriggers, riskLevel };
}

export function useTriggerDetect(): TriggerInfo {
  const [info, setInfo] = useState<TriggerInfo>(computeRisk);

  useEffect(() => {
    // Recompute every minute
    const id = setInterval(() => setInfo(computeRisk()), 60_000);
    return () => clearInterval(id);
  }, []);

  return info;
}
