// ─── All mock data for Project Aegis — no backend required ───

export const mockUser = {
  _id: 'u1',
  name: 'Rituraj Anos',
  email: 'rituraj@aegis.dev',
  avatarUrl: null as string | null,
  coachState: 1 as 0 | 1 | 2,
  role: 'user',
};

export const mockTransactions = [
  { _id: 't1', amount: 4200, category: 'Food', merchantName: 'Zomato', description: 'Late night order', timestamp: '2026-04-24T23:15:00Z', source: 'mock_api', isIntercepted: true },
  { _id: 't2', amount: 12500, category: 'Shopping', merchantName: 'Myntra', description: 'Weekend sale haul', timestamp: '2026-04-20T14:30:00Z', source: 'manual', isIntercepted: true },
  { _id: 't3', amount: 800, category: 'Food', merchantName: 'Swiggy', description: 'Lunch', timestamp: '2026-04-22T13:00:00Z', source: 'csv', isIntercepted: false },
  { _id: 't4', amount: 3500, category: 'Entertainment', merchantName: 'BookMyShow', description: 'Weekend movies', timestamp: '2026-04-19T19:00:00Z', source: 'manual', isIntercepted: true },
  { _id: 't5', amount: 650, category: 'Transport', merchantName: 'Uber', description: 'Late night cab', timestamp: '2026-04-25T00:30:00Z', source: 'mock_api', isIntercepted: false },
  { _id: 't6', amount: 2200, category: 'Shopping', merchantName: 'Amazon', description: 'Impulse buy', timestamp: '2026-04-18T22:45:00Z', source: 'manual', isIntercepted: true },
];

export type MockTransaction = typeof mockTransactions[number];

export const mockBudget = {
  globalThreshold: 10000,
  categoryLimits: [
    { category: 'Food', limit: 3000 },
    { category: 'Shopping', limit: 5000 },
  ],
  sipRate: 12,
  fdRate: 6.5,
  inflationRate: 6,
  timeHorizonYears: 10,
};

export const mockAlerts = [
  {
    _id: 'a1',
    transactionId: 't1',
    coachState: 1 as 0 | 1 | 2,
    tone: 'firm',
    message: "You've ordered late-night food 4 times this week. That's ₹4,200 — and it's a pattern.",
    shadowInsight: '₹4,200 invested monthly = ₹41,800 in 10 years (SIP @ 12%)',
    projectedSIP: 41800,
    projectedFD: 28400,
    projectedInflationAdj: 23300,
    acknowledged: false,
  },
  {
    _id: 'a2',
    transactionId: 't2',
    coachState: 1 as 0 | 1 | 2,
    tone: 'firm',
    message: 'Weekend shopping surge detected. ₹12,500 in one session is 125% of your shopping budget.',
    shadowInsight: '₹12,500 monthly = ₹1,24,300 in 10 years',
    projectedSIP: 124300,
    projectedFD: 84600,
    projectedInflationAdj: 69200,
    acknowledged: false,
  },
];

export type MockAlert = typeof mockAlerts[number];

export const mockAnalytics = {
  categoryHeatmap: [
    { name: 'Food', value: 7650, fill: '#FF6B6B' },
    { name: 'Shopping', value: 14700, fill: '#FFB347' },
    { name: 'Entertainment', value: 3500, fill: '#00FF87' },
    { name: 'Transport', value: 1250, fill: '#4ECDC4' },
    { name: 'Utilities', value: 2100, fill: '#45B7D1' },
  ],
  savingsStreak: {
    currentStreak: 3,
    longestStreak: 12,
    weeklyData: [
      { day: 'Mon', underBudget: true },
      { day: 'Tue', underBudget: true },
      { day: 'Wed', underBudget: false },
      { day: 'Thu', underBudget: true },
      { day: 'Fri', underBudget: true },
      { day: 'Sat', underBudget: false },
      { day: 'Sun', underBudget: true },
    ],
  },
  triggerMap: [
    { hour: 23, day: 'Sat', riskScore: 85 },
    { hour: 0, day: 'Sun', riskScore: 90 },
    { hour: 22, day: 'Fri', riskScore: 75 },
    { hour: 14, day: 'Sat', riskScore: 60 },
    { hour: 20, day: 'Mon', riskScore: 55 },
  ],
  weeklySpend: [
    { day: 'Mon', amount: 650 },
    { day: 'Tue', amount: 0 },
    { day: 'Wed', amount: 800 },
    { day: 'Thu', amount: 3500 },
    { day: 'Fri', amount: 2200 },
    { day: 'Sat', amount: 12500 },
    { day: 'Sun', amount: 4200 },
  ],
};

export const mockCounterfactual = {
  savedToday: 23450,
  savedIn15Years: 284600,
  alertsIgnored: 4,
  weeklyCards: [
    { week: 'Apr 7–13', savedAmount: 4200, sipValue: 41800 },
    { week: 'Apr 14–20', savedAmount: 8900, sipValue: 88500 },
    { week: 'Apr 21–25', savedAmount: 23450, sipValue: 233200 },
    { week: 'Projected', savedAmount: 31000, sipValue: 308400 },
  ],
};

export const mockShadow = {
  amount: 4200,
  sipProjection: 41800,
  fdProjection: 28400,
  inflationAdjProjection: 23300,
  timeHorizonYears: 10,
  sipRate: 12,
  fdRate: 6.5,
};

// ─── SIP projection points for charts ───
export function buildProjectionPoints(amount: number, sipRate = 12, fdRate = 6.5, inflationRate = 6, years = 10) {
  return Array.from({ length: years + 1 }, (_, yr) => ({
    year: yr,
    sip: Math.round(amount * Math.pow(1 + sipRate / 100, yr)),
    fd: Math.round(amount * Math.pow(1 + fdRate / 100, yr)),
    inflationAdj: Math.round(amount * Math.pow(1 + (sipRate - inflationRate) / 100, yr)),
  }));
}

export const COACH_CONFIG = {
  0: { label: 'Gentle', color: '#00FF87', bg: 'rgba(0,255,135,0.12)', border: 'rgba(0,255,135,0.3)' },
  1: { label: 'Firm', color: '#FFD16F', bg: 'rgba(255,209,111,0.12)', border: 'rgba(255,209,111,0.35)' },
  2: { label: 'Blunt', color: '#FF6B6B', bg: 'rgba(255,107,107,0.12)', border: 'rgba(255,107,107,0.4)' },
} as const;

export const CATEGORY_EMOJI: Record<string, string> = {
  Food: '🍔', Shopping: '🛍️', Entertainment: '🎬',
  Transport: '🚗', Health: '💊', Utilities: '💡',
  Education: '📚', Travel: '✈️', Other: '💳',
};

// ─── Indian rupee formatter ───
export function inr(n: number): string {
  return '₹' + n.toLocaleString('en-IN');
}
