import { ReportRecord } from '../types';
import { getRepo } from '../repo';
import { haversineMeters } from '../utils/helpers';

export interface DuplicateMatch {
  report: ReportRecord;
  distanceMeters: number | null;
  reason: string;
  score: number;
}

const CATEGORY_MATCH_SCORE = 60;
const TITLE_TOKEN_SCORE = 40;
const DUPLICATE_RADIUS_METERS = 200;

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 3);
}

export async function findNearbyDuplicates(
  source: ReportRecord,
  limit = 5
): Promise<DuplicateMatch[]> {
  const repo = getRepo();
  const all = await repo.allReports();
  const sourceTokens = new Set(tokens(`${source.title} ${source.description}`));

  const matches: DuplicateMatch[] = [];

  for (const other of all) {
    if (other.id === source.id) continue;
    if (other.status === 'resolved' && source.status === 'resolved') continue;

    let distance: number | null = null;
    if (
      source.latitude != null &&
      source.longitude != null &&
      other.latitude != null &&
      other.longitude != null
    ) {
      distance = Math.round(
        haversineMeters(source.latitude, source.longitude, other.latitude, other.longitude)
      );
    }

    let score = 0;
    const reasons: string[] = [];

    const sameCategory = other.category === source.category;
    const close = distance !== null && distance <= DUPLICATE_RADIUS_METERS;

    if (sameCategory && close) {
      score = 90;
      reasons.push(`same category within ${distance} m`);
    } else if (sameCategory) {
      score = CATEGORY_MATCH_SCORE;
      reasons.push('same issue category');
    } else if (close) {
      score = 55;
      reasons.push(`nearby location (${distance} m)`);
    }

    const otherTokens = new Set(tokens(`${other.title} ${other.description}`));
    let shared = 0;
    otherTokens.forEach((t) => {
      if (sourceTokens.has(t)) shared += 1;
    });
    const overlap =
      sourceTokens.size === 0 || otherTokens.size === 0
        ? 0
        : shared / Math.max(sourceTokens.size, otherTokens.size);
    if (overlap >= 0.4) {
      score += TITLE_TOKEN_SCORE;
      reasons.push(`${Math.round(overlap * 100)}% description overlap`);
    }

    if (score >= 55 && reasons.length > 0) {
      matches.push({
        report: other,
        distanceMeters: distance,
        reason: reasons.join(' · '),
        score: Math.min(100, score),
      });
    }
  }

  return matches.sort((a, b) => b.score - a.score).slice(0, limit);
}
