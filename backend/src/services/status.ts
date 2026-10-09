import { Status } from '../types';

/** Allowed complaint lifecycle transitions (enforced server-side). */
export const VALID_TRANSITIONS: Record<Status, Status[]> = {
  pending: ['assigned'],
  assigned: ['pending', 'in_progress'],
  in_progress: ['assigned', 'resolved'],
  resolved: ['in_progress'],
};

export function canTransition(from: Status, to: Status): boolean {
  return (VALID_TRANSITIONS[from] || []).includes(to);
}

export function allowedNextStatuses(from: Status): Status[] {
  return VALID_TRANSITIONS[from] || [];
}
