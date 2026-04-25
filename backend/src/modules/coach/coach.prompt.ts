import type { CoachContext } from './coach.context.js';

const PERSONAS: Record<0 | 1 | 2, string> = {
  0: 'You are Sage, a warm and encouraging financial coach. Celebrate wins, gently guide improvements, and always end on a positive note.',
  1: 'You are Sage, a direct and results-focused financial coach. Acknowledge efforts but prioritise data-driven warnings without sugar-coating.',
  2: 'You are Sage, a brutally honest financial coach. No sugar-coating. State problems plainly and demand immediate corrective action.',
};

function fmt(cents: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100);
}

export function buildCoachPrompt(ctx: CoachContext): string {
  const persona   = PERSONAS[ctx.coachState];
  const savingsRate = ctx.monthIncome > 0
    ? Math.round(((ctx.monthIncome - ctx.monthSpend) / ctx.monthIncome) * 100)
    : 0;

  const accountLines = ctx.accounts
    .map((a) => `  • ${a.name} (${a.type}): ${fmt(a.balance, a.currency)}`)
    .join('\n');

  const budgetLines = ctx.budgets
    .map((b) => `  • ${b.name} [${b.category}]: spent ${fmt(b.currentSpend)} / ${fmt(b.amount)} (${b.percentUsed}%)${b.percentUsed >= 80 ? ' ⚠️ HIGH' : ''}`)
    .join('\n');

  const txLines = ctx.recentTx.slice(0, 10)
    .map((t) => `  • ${new Date(t.date).toLocaleDateString()} | ${t.type.toUpperCase()} | ${t.category} | ${fmt(t.amount)}`)
    .join('\n');

  return `${persona}

=== DATA SNAPSHOT ===
Net Worth:      ${fmt(ctx.netWorth)}
Month Income:   ${fmt(ctx.monthIncome)}
Month Spend:    ${fmt(ctx.monthSpend)}
Savings Rate:   ${savingsRate}%

ACCOUNTS:
${accountLines || '  (none)'}

BUDGETS:
${budgetLines || '  (none)'}

LAST 10 TRANSACTIONS:
${txLines || '  (none)'}

=== INSTRUCTIONS ===
Respond ONLY with a JSON object — no markdown, no preamble, no trailing text.
Schema:
{
  "summary": "string (2-3 sentences on overall financial health)",
  "insights": [
    { "title": "string", "body": "string", "severity": "info" | "warning" | "critical" }
  ],
  "suggestions": [
    { "action": "string", "reason": "string", "impact": "low" | "medium" | "high" }
  ],
  "encouragement": "string (1 sentence, persona-appropriate)"
}
Rules: insights 2-4 items, suggestions 2-3 items. Raw JSON only.`;
}
