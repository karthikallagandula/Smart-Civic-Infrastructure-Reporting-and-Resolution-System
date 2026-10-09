import { Category, Priority, ReportRecord, Severity } from '../types';
import { haversineMeters, titleCase } from '../utils/helpers';

export const DEPARTMENT_BY_CATEGORY: Record<Category, string> = {
  pothole: 'Roads Department',
  road_damage: 'Roads Department',
  streetlight: 'Electrical Department',
  water_leakage: 'Water Supply Department',
  manhole: 'Sanitation & Drainage Department',
  drainage: 'Sanitation & Drainage Department',
  other: 'Urban Infrastructure Department',
};

export const CATEGORY_LABELS: Record<Category, string> = {
  pothole: 'Pothole',
  road_damage: 'Road Damage',
  streetlight: 'Broken Streetlight',
  manhole: 'Open / Damaged Manhole',
  water_leakage: 'Water Pipeline Leakage',
  drainage: 'Drainage Problem',
  other: 'Other Civic Infrastructure',
};

export function suggestDepartment(category: Category): string {
  return DEPARTMENT_BY_CATEGORY[category] || 'Urban Infrastructure Department';
}

const BASE_SCORE: Record<Category, number> = {
  manhole: 3,
  pothole: 2,
  road_damage: 2,
  water_leakage: 2,
  drainage: 2,
  streetlight: 1,
  other: 1,
};

const DANGER_TERMS = [
  'accident',
  'injur',
  'hospital',
  'school',
  'children',
  'kids',
  'busy road',
  'main road',
  'highway',
  'traffic',
  'deep',
  'open hole',
  'exposed',
  'electric',
  'shock',
  'spark',
  'live wire',
  'sewage',
  'overflow',
  'flood',
  'blocked',
  'night',
  'dark',
  'no light',
  'unlit',
  'collapse',
  'cave',
  'danger',
  'fatal',
];

/** Sample sensitive locations used for proximity-based priority nudges (demo city: Hyderabad, Telangana). */
const SENSITIVE_PLACES: { name: string; lat: number; lng: number }[] = [
  { name: 'City General Hospital', lat: 17.3850, lng: 78.4867 },
  { name: 'Government Higher Primary School', lat: 17.3800, lng: 78.4800 },
  { name: 'Central Bus Terminal', lat: 17.3750, lng: 78.4750 },
  { name: 'Children\'s Park', lat: 17.3900, lng: 78.4900 },
  { name: 'Railway Station', lat: 17.3950, lng: 78.5000 },
];

export interface PrioritySuggestion {
  priority: Priority;
  reason: string;
}

/**
 * Transparent, rule-based priority suggestion.
 * This is a suggested triage value only — it is NOT a safety determination and
 * administrators can review and override it at any time.
 */
export function suggestPriority(input: {
  category: Category;
  severity: Severity;
  title: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
}): PrioritySuggestion {
  const text = `${input.title} ${input.description}`.toLowerCase();
  const factors: string[] = [];
  let score = BASE_SCORE[input.category] ?? 1;
  factors.push(`${CATEGORY_LABELS[input.category] || titleCase(input.category)} baseline risk`);

  if (input.severity === 'high') {
    score += 2;
    factors.push('citizen reported high severity');
  } else if (input.severity === 'medium') {
    score += 1;
    factors.push('citizen reported medium severity');
  } else {
    factors.push('citizen reported low severity');
  }

  const matched = DANGER_TERMS.filter((t) => text.includes(t));
  if (matched.length > 0) {
    score += Math.min(2, matched.length >= 2 ? 2 : 1);
    factors.push(
      `safety keywords mentioned (${matched.slice(0, 3).join(', ')}${matched.length > 3 ? ', …' : ''})`
    );
  }

  if (
    input.latitude !== null &&
    input.longitude !== null &&
    Number.isFinite(input.latitude) &&
    Number.isFinite(input.longitude)
  ) {
    const near = SENSITIVE_PLACES.find(
      (p) => haversineMeters(input.latitude!, input.longitude!, p.lat, p.lng) <= 250
    );
    if (near) {
      score += 1;
      factors.push(`within 250 m of ${near.name}`);
    }
  }

  let priority: Priority;
  if (score >= 5) priority = 'high';
  else if (score >= 3) priority = 'medium';
  else priority = 'low';

  const reason = `Auto-suggested ${priority} priority — score ${score}: ${factors.join('; ')}. Suggested only, subject to administrator review.`;
  return { priority, reason };
}
