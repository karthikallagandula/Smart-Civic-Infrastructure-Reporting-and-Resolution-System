import env from '../config/env';
import { CATEGORIES, Category } from '../types';

export const aiEnabled = (): boolean => Boolean(env.ai.apiKey);

const CATEGORY_HINTS: Record<Category, string[]> = {
  pothole: ['pothole', 'hole', 'pit', 'road hole'],
  road_damage: ['road', 'asphalt', 'crack', 'pavement', 'tar', 'speed breaker'],
  streetlight: ['streetlight', 'street light', 'lamp', 'light pole', 'lighting'],
  manhole: ['manhole', 'man hole', 'sewer', 'manhole cover'],
  water_leakage: ['water', 'leak', 'pipe', 'pipeline', 'burst', 'tap'],
  drainage: ['drain', 'drainage', 'gutter', 'sewage', 'canal'],
  other: [],
};

export function fallbackCategoryFromText(text: string): { category: Category; confidence: null } {
  const lower = (text || '').toLowerCase();
  let best: Category = 'other';
  let bestScore = 0;
  for (const cat of CATEGORIES) {
    const score = CATEGORY_HINTS[cat].filter((h) => lower.includes(h)).length;
    if (score > bestScore) {
      bestScore = score;
      best = cat;
    }
  }
  return { category: best, confidence: null };
}

function extractJson(raw: string): any | null {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function callAI(messages: unknown[], maxTokens = 400): Promise<string | null> {
  if (!aiEnabled()) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(`${env.ai.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.ai.apiKey}`,
      },
      body: JSON.stringify({ model: env.ai.model, messages, max_tokens: maxTokens, temperature: 0.2 }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data?.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

export interface CategorySuggestion {
  suggestedCategory: Category;
  confidence: number | null;
  source: 'ai' | 'keyword-fallback';
  note: string;
}

/**
 * Optional AI image analysis. Never blocks complaint submission:
 * falls back to a keyword heuristic when no AI key is configured or the call fails.
 */
export async function suggestCategoryFromImage(
  buffer: Buffer,
  mime: string,
  fileName: string
): Promise<CategorySuggestion> {
  const base = `data:${mime};base64,${buffer.toString('base64')}`;
  const content = await callAI([
    {
      role: 'system',
      content:
        'You classify civic infrastructure photos. Reply ONLY with JSON: {"category":"pothole|road_damage|streetlight|manhole|water_leakage|drainage|other","confidence":0.0}',
    },
    { role: 'user', content: [{ type: 'text', text: 'Classify this civic issue photo.' }, { type: 'image_url', image_url: { url: base } }] },
  ]);

  if (content) {
    const parsed = extractJson(content);
    if (parsed && CATEGORIES.includes(parsed.category)) {
      const conf = Number(parsed.confidence);
      return {
        suggestedCategory: parsed.category as Category,
        confidence: Number.isFinite(conf) ? Math.max(0, Math.min(1, Math.round(conf * 100) / 100)) : null,
        source: 'ai',
        note: 'AI suggestion — please confirm or correct the category before submitting.',
      };
    }
  }

  const fallback = fallbackCategoryFromText(fileName);
  return {
    suggestedCategory: fallback.category,
    confidence: fallback.confidence,
    source: 'keyword-fallback',
    note: aiEnabled()
      ? 'AI is currently unavailable, so a keyword-based suggestion was used. Please confirm the category.'
      : 'No AI key configured — this is a keyword-based suggestion (not an image analysis). Please confirm the category.',
  };
}

export interface TextAssist {
  title: string;
  description: string;
  source: 'ai' | 'rule-fallback';
  note: string;
}

export async function assistDescription(text: string): Promise<TextAssist> {
  const cleaned = text.trim().replace(/\s+/g, ' ');
  const content = await callAI([
    {
      role: 'system',
      content:
        'You help citizens write concise civic complaint text. Reply ONLY with JSON {"title":"...","description":"..."} (title <= 90 chars). Never invent a location, date, or claim the issue was verified.',
    },
    { role: 'user', content: cleaned },
  ]);

  if (content) {
    const parsed = extractJson(content);
    if (parsed && typeof parsed.title === 'string' && typeof parsed.description === 'string') {
      return {
        title: parsed.title.slice(0, 120),
        description: parsed.description.slice(0, 2000),
        source: 'ai',
        note: 'AI-drafted text — review and edit before submitting.',
      };
    }
  }

  const firstStop = cleaned.search(/[.!?\n]/);
  const rawTitle = firstStop > 10 ? cleaned.slice(0, firstStop) : cleaned.slice(0, 90);
  return {
    title: rawTitle.replace(/[.!?\n]+$/, '').slice(0, 90),
    description: cleaned.slice(0, 2000),
    source: 'rule-fallback',
    note: 'AI is not configured — this is a plain text tidy-up, not an AI draft.',
  };
}
