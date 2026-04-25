// ─── Mock API layer — swap the body of each function for a real fetch later ───
import {
  mockUser, mockTransactions, mockBudget, mockAlerts,
  mockAnalytics, mockCounterfactual, mockShadow, buildProjectionPoints,
  type MockTransaction,
} from './data';

/** Simulates network latency */
export const mockDelay = <T>(data: T, ms = 800): Promise<T> =>
  new Promise(res => setTimeout(() => res(data), ms));

// ── Auth ──────────────────────────────────────────────────────────────────────
export const apiLogin = (_email: string, _password: string) =>
  mockDelay({ user: mockUser, accessToken: 'mock-token-xyz' });

export const apiRegister = (_name: string, _email: string, _password: string) =>
  mockDelay({ user: mockUser, accessToken: 'mock-token-xyz' });

export const apiGetMe = () => mockDelay(mockUser);

// ── Transactions ──────────────────────────────────────────────────────────────
export const apiGetTransactions = (category = '', search = '') => {
  let data = [...mockTransactions];
  if (category) data = data.filter(t => t.category.toLowerCase() === category.toLowerCase());
  if (search) data = data.filter(t => t.merchantName.toLowerCase().includes(search.toLowerCase()));
  return mockDelay({ data, total: data.length, page: 1, totalPages: 1 });
};

export const apiDeleteTransaction = (id: string) =>
  mockDelay({ success: true, id });

export const apiUploadCSV = (_file: File) =>
  mockDelay({ imported: 3, skipped: 0 });

export const apiStartMockFeed = () => mockDelay({ started: true });
export const apiStopMockFeed = () => mockDelay({ stopped: true });

// Random mock transaction generator for mock feed
let mockFeedCounter = 10;
const MOCK_MERCHANTS = ['Blinkit', 'Swiggy Instamart', 'Nykaa', 'Flipkart', 'Ola', 'Netflix'];
const MOCK_CATS = ['Food', 'Shopping', 'Entertainment', 'Transport'];
export function generateRandomTransaction(): MockTransaction {
  mockFeedCounter++;
  const i = Math.floor(Math.random() * MOCK_MERCHANTS.length);
  const cat = MOCK_CATS[Math.floor(Math.random() * MOCK_CATS.length)];
  return {
    _id: `t${mockFeedCounter}`,
    amount: Math.floor(Math.random() * 3000) + 200,
    category: cat,
    merchantName: MOCK_MERCHANTS[i],
    description: 'Auto-generated',
    timestamp: new Date().toISOString(),
    source: 'mock_api',
    isIntercepted: Math.random() > 0.5,
  };
}

// ── Budgets ───────────────────────────────────────────────────────────────────
export const apiGetBudget = () => mockDelay(mockBudget);
export const apiSaveBudget = (data: typeof mockBudget) => mockDelay({ ...mockBudget, ...data });

// ── Alerts ────────────────────────────────────────────────────────────────────
export const apiGetAlerts = () => mockDelay(mockAlerts);
export const apiAcknowledgeAlert = (id: string) => mockDelay({ success: true, id });

// ── Dashboard stats ───────────────────────────────────────────────────────────
export const apiGetDashboardStats = () =>
  mockDelay({
    totalSpentThisMonth: 23850,
    budgetRemaining: 6150,
    budgetTotal: 30000,
    savingsStreak: 3,
    coachState: 1 as 0 | 1 | 2,
    recentTransactions: mockTransactions.slice(0, 3),
    activeAlerts: mockAlerts,
  });

// ── Analytics ─────────────────────────────────────────────────────────────────
export const apiGetAnalytics = () => mockDelay(mockAnalytics);
export const apiGetCounterfactual = () => mockDelay(mockCounterfactual);

// ── Shadow / Projection ───────────────────────────────────────────────────────
export const apiGetShadow = (amount = 4200) =>
  mockDelay({ ...mockShadow, amount, projectionPoints: buildProjectionPoints(amount) });

export const apiGetProjectionPoints = (amount: number) =>
  mockDelay(buildProjectionPoints(amount));

// ── User / Settings ───────────────────────────────────────────────────────────
export const apiUpdateProfile = (data: Partial<typeof mockUser>) =>
  mockDelay({ ...mockUser, ...data });

export const apiUpdateCoachState = (state: 0 | 1 | 2) =>
  mockDelay({ ...mockUser, coachState: state });

export const apiDeleteAccount = () =>
  mockDelay({ success: true });
