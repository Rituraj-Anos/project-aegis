import { Types } from 'mongoose';
import { buildCoachContext } from './coach.context.js';
import { buildCoachPrompt } from './coach.prompt.js';
import { UserModel } from '../users/user.model.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { withCache, cacheDel, cacheKeys } from '../../utils/cache.js';
import { emitToUser } from '../../sockets/index.js';

export interface CoachInsight {
  summary:      string;
  insights:     { title: string; body: string; severity: 'info' | 'warning' | 'critical' }[];
  suggestions:  { action: string; reason: string; impact: 'low' | 'medium' | 'high' }[];
  encouragement: string;
}

function validateInsight(obj: any): obj is CoachInsight {
  return (
    typeof obj?.summary === 'string' &&
    Array.isArray(obj?.insights) &&
    Array.isArray(obj?.suggestions) &&
    typeof obj?.encouragement === 'string'
  );
}

export async function getCoachInsight(userId: string): Promise<CoachInsight> {
  return withCache(cacheKeys.coachInsight(userId), 3600, async () => {
    const ctx    = await buildCoachContext(userId);
    const prompt = buildCoachPrompt(ctx);

    const response = await fetch(`${env.GROQ_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model:           env.GROQ_MODEL,
        messages:        [{ role: 'user', content: prompt }],
        temperature:     0.4,
        max_tokens:      1000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      logger.error('Coach LLM request failed', { status: response.status });
      throw new Error('Coach service unavailable');
    }

    const json    = await response.json() as any;
    const content = json?.choices?.[0]?.message?.content;

    if (!content) throw new Error('Coach returned empty response');

    const parsed = JSON.parse(content);

    if (!validateInsight(parsed)) {
      throw new Error('Coach returned malformed response');
    }

    return parsed;
  });
}

export async function updateCoachState(userId: string, coachState: 0 | 1 | 2): Promise<void> {
  await UserModel.findOneAndUpdate(
    { _id: new Types.ObjectId(userId) },
    { coachState, coachStateUpdatedAt: new Date() },
  );
  await cacheDel(cacheKeys.coachInsight(userId));
  emitToUser(userId, 'coach:state-changed', { state: coachState });
}
