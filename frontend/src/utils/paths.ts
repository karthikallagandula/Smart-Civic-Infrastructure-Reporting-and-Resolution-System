import { Role } from '../types';

export function reportDetailPath(id: string, role: Role): string {
  return role === 'admin' ? `/admin/reports/${id}` : `/complaints/${id}`;
}
