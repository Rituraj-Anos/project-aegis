import { Types } from 'mongoose';
import { TransactionModel } from '../transactions/transaction.model.js';
import { AccountModel } from '../accounts/account.model.js';

// ── Category Heatmap ─────────────────────────────────────
// GET /analytics/category-heatmap
export async function getCategoryHeatmap(userId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 365);

  const raw = await TransactionModel.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        isDeleted: false,
        type: 'expense',
        date: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: '$category',
        value: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { value: -1 } },
  ]);

  const COLORS = ['#00FF87', '#FFD16F', '#FF6B6B', '#60A5FA', '#A78BFA', '#F472B6', '#34D399', '#FB923C'];

  return raw.map((r, i) => ({
    name: r._id,
    value: r.value,
    count: r.count,
    fill: COLORS[i % COLORS.length],
  }));
}

// ── Savings Streak ───────────────────────────────────────
// GET /analytics/savings-streak
export async function getSavingsStreak(userId: string) {
  // Get user's budget threshold — default 30000 if none set
  let budgetThreshold = 30000;
  try {
    const { BudgetModel } = await import('../budgets/budget.model.js');
    const budget = await BudgetModel.findOne({ userId: new Types.ObjectId(userId) });
    if (budget?.globalThreshold) budgetThreshold = budget.globalThreshold;
  } catch { /* no budget module */ }

  const dailySpend = await TransactionModel.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        isDeleted: false,
        type: 'expense',
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' },
        },
        total: { $sum: '$amount' },
      },
    },
  ]);

  dailySpend.sort((a, b) => {
    const dateA = new Date(a._id.year, a._id.month - 1, a._id.day).getTime();
    const dateB = new Date(b._id.year, b._id.month - 1, b._id.day).getTime();
    return dateA - dateB;
  });

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyData = [];
  let longestStreak = 0;
  let streak = 0;
  const dailyLimit = budgetThreshold / 30;

  for (const daySpend of dailySpend) {
    const spent = daySpend.total;
    if (spent <= dailyLimit) {
      streak++;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      streak = 0;
    }
  }

  let maxDate = new Date();
  if (dailySpend.length > 0) {
    const last = dailySpend[dailySpend.length - 1];
    maxDate = new Date(last!._id.year, last!._id.month - 1, last!._id.day);
  }

  for (let i = 6; i >= 0; i--) {
    const d = new Date(maxDate);
    d.setDate(d.getDate() - i);
    const daySpend = dailySpend.find(
      (s) => s._id.year === d.getFullYear() && s._id.month === d.getMonth() + 1 && s._id.day === d.getDate(),
    );
    const spent = daySpend?.total ?? 0;
    const underBudget = spent <= dailyLimit;
    weeklyData.push({ day: DAYS[d.getDay()]!, underBudget, spent });
  }

  return { currentStreak: streak, longestStreak, weeklyData };
}

// ── Trigger Map ──────────────────────────────────────────
// GET /analytics/trigger-map
export async function getTriggerMap(userId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 365);

  const raw = await TransactionModel.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        isDeleted: false,
        type: 'expense',
        date: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          hour: { $hour: '$date' },
          dow: { $dayOfWeek: '$date' }, // 1=Sun, 7=Sat
        },
        riskScore: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const maxScore = Math.max(...raw.map((r) => r.riskScore), 1);

  return raw.map((r) => ({
    hour: r._id.hour,
    day: DAYS[r._id.dow - 1]!,
    riskScore: Math.round((r.riskScore / maxScore) * 100),
    count: r.count,
  }));
}

// ── Weekly Report ────────────────────────────────────────
// GET /analytics/weekly-report
export async function getWeeklyReport(userId: string) {
  const dailySpend = await TransactionModel.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        isDeleted: false,
        type: 'expense',
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' },
          dow: { $dayOfWeek: '$date' },
        },
        amount: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
  ]);

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklySpend = [];

  let maxDate = new Date();
  if (dailySpend.length > 0) {
    const last = dailySpend[dailySpend.length - 1];
    maxDate = new Date(last!._id.year, last!._id.month - 1, last!._id.day);
  }

  for (let i = 6; i >= 0; i--) {
    const d = new Date(maxDate);
    d.setDate(d.getDate() - i);
    const daySpend = dailySpend.find(
      (s) => s._id.year === d.getFullYear() && s._id.month === d.getMonth() + 1 && s._id.day === d.getDate(),
    );
    weeklySpend.push({
      day: DAYS[d.getDay()]!,
      amount: daySpend?.amount ?? 0,
    });
  }

  const totalSpend = weeklySpend.reduce((s, d) => s + d.amount, 0);

  const sevenDaysBeforeMax = new Date(maxDate);
  sevenDaysBeforeMax.setDate(sevenDaysBeforeMax.getDate() - 6);
  sevenDaysBeforeMax.setHours(0, 0, 0, 0);

  const interceptedCount = await TransactionModel.countDocuments({
    userId: new Types.ObjectId(userId),
    isDeleted: false,
    isIntercepted: true,
    date: { $gte: sevenDaysBeforeMax },
  });

  return { weeklySpend, totalSpend, interceptedCount };
}

// ── Counterfactual ───────────────────────────────────────
export async function getCounterfactual(userId: string) {
  const intercepted = await TransactionModel.find({
    userId: new Types.ObjectId(userId),
    isDeleted: false,
    isIntercepted: true,
    date: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
  }).lean();

  let savedToday = intercepted.reduce((s, t) => s + t.amount, 0);
  let alertsIgnored = intercepted.length;

  if (savedToday === 0) {
    const allExpenses = await TransactionModel.find({
      userId: new Types.ObjectId(userId),
      isDeleted: false,
      type: 'expense',
      date: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
    }).lean();
    savedToday = allExpenses.reduce((s, t) => s + t.amount, 0);
    alertsIgnored = allExpenses.length;
  }

  // SIP @ 12% for 15 years
  const r = 0.12 / 12;
  const n = 15 * 12;
  const savedIn15Years = savedToday > 0
    ? Math.round(savedToday * (Math.pow(1 + r, n) - 1) / r * (1 + r))
    : 0;

  return {
    savedToday,
    savedIn15Years,
    alertsIgnored,
  };
}

// ── Legacy endpoints (kept for backward compat) ──────────
export async function getCashFlow(userId: string, query: any) {
  return getCategoryHeatmap(userId);
}

export async function getCategoryBreakdown(userId: string, query: any) {
  return getCategoryHeatmap(userId);
}

export async function getSavingsRate(userId: string, query: any) {
  return getSavingsStreak(userId);
}

// ── AI Insight & Coach ───────────────────────────────────
export async function generateAiInsight(userId: string, payload: any) {
  let prompt = '';
  if (payload.type === 'coach_alert') {
    const { amount, category, coachState, weeklySpend } = payload;
    const tone = coachState === 2 ? 'Blunt' : coachState === 1 ? 'Firm' : 'Gentle';
    prompt = `You are a financial coach. Tone: ${tone}. 
The user is trying to spend ₹${amount} on ${category}. 
They have already spent ₹${weeklySpend} this week.
Generate a 2-sentence coach message to intercept this impulse spend. 
Make it feel like a real conversation. For example, if Firm: "That's your 4th food delivery this week. ₹4,200 in food alone — invested monthly, that becomes ₹41,800 in 10 years. Is this order worth a year of compound growth?"`;
  } else {
    prompt = `You are a sharp Indian financial coach. The user spent ₹${payload.totalSpend} on impulse purchases.
If invested via SIP at 12%: ₹${payload.sipProjection5y} in 5 years, ₹${payload.sipProjection10y} in 10 years, ₹${payload.sipProjection15y} in 15 years.
Write 2 sentences maximum. Be specific, motivating, use Indian context (flat in Mumbai, international trip, early retirement). Do not use generic phrases.`;
  }

  try {
    const { env } = await import('../../config/env.js');
    console.log('Groq API called with:', prompt);
    const response = await fetch(`${env.GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }
    const json = await response.json() as any;
    return { insight: json?.choices?.[0]?.message?.content?.replace(/["']/g, "") || "Keep saving!" };
  } catch (error) {
    console.error('Groq API error:', error);
    throw error;
  }
}