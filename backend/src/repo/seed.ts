import bcrypt from 'bcryptjs';
import {
  NotificationRecord,
  ReportRecord,
  StatusHistoryRecord,
  UserRecord,
  Category,
  Priority,
  Severity,
  Status,
} from '../types';
import { complaintIdFor } from '../utils/helpers';
import { suggestDepartment, suggestPriority } from '../services/priority';

export interface SeedData {
  users: UserRecord[];
  reports: ReportRecord[];
  history: StatusHistoryRecord[];
  notifications: NotificationRecord[];
  seq: number;
}

/** Demo accounts used only when the app runs without MongoDB (clearly labelled in the UI). */
export const DEMO_ACCOUNTS = [
  { role: 'admin' as const, email: 'admin@demo.civicconnect.gov', password: 'Admin@1234', name: 'R. Sharma (Civic Authority)' },
  { role: 'admin' as const, email: 'authority@demo.civicconnect.gov', password: 'Admin@1234', name: 'S. Iyer (Control Room)' },
  { role: 'citizen' as const, email: 'citizen@demo.civicconnect.gov', password: 'Citizen@1234', name: 'A. Mehta' },
  { role: 'citizen' as const, email: 'priya@demo.civicconnect.gov', password: 'Citizen@1234', name: 'P. Nair' },
];

interface SeedSpec {
  idx: number;
  category: Category;
  title: string;
  description: string;
  severity: Severity;
  lat: number;
  lng: number;
  address: string;
  status: Status;
  priorityOverride?: Priority;
  citizen: 0 | 1;
  daysAgo: number;
  team?: string;
  resolutionNote?: string;
}

const SPECS: SeedSpec[] = [
  {
    idx: 1,
    category: 'manhole',
    title: 'Open manhole without cover on MG Road junction',
    description:
      'The manhole cover is completely missing at the busy junction. Deep open hole with exposed edges. High risk of accident for two-wheelers and school children passing in the morning.',
    severity: 'high',
    lat: 17.3856,
    lng: 78.4968,
    address: 'MG Road Junction, Hyderabad, Telangana',
    status: 'resolved',
    citizen: 0,
    daysAgo: 9,
    team: 'Drainage Team 2',
    resolutionNote: 'New cast-iron manhole cover installed and levelled. Area inspected by safety officer.',
  },
  {
    idx: 2,
    category: 'pothole',
    title: 'Deep pothole causing traffic hazard near bus stop',
    description:
      'Large pothole about 30 cm deep right in front of the bus stop. Buses swerve into the next lane to avoid it — traffic hazard during peak hours.',
    severity: 'high',
    lat: 17.3862,
    lng: 78.4829,
    address: 'Near City General Hospital, Hyderabad, Telangana',
    status: 'in_progress',
    citizen: 0,
    daysAgo: 4,
    team: 'Road Repair Crew A',
  },
  {
    idx: 3,
    category: 'streetlight',
    title: 'Streetlight pole dark for two weeks',
    description:
      'Three consecutive streetlights on this stretch are not working. The stretch is very dark at night near the park entrance.',
    severity: 'medium',
    lat: 17.3884,
    lng: 78.4816,
    address: 'Children\'s Park Road, Hyderabad, Telangana',
    status: 'assigned',
    citizen: 1,
    daysAgo: 3,
    team: 'Electrical Team 1',
  },
  {
    idx: 4,
    category: 'water_leakage',
    title: 'Water pipeline leaking onto the footpath',
    description:
      'Continuous leakage from a broken supply pipe near the corner shop. Water is wasting and the footpath is slippery for pedestrians.',
    severity: 'medium',
    lat: 17.3835,
    lng: 78.4883,
    address: '12th Main, Indiranagar, Hyderabad, Telangana',
    status: 'pending',
    citizen: 1,
    daysAgo: 1,
  },
  {
    idx: 5,
    category: 'drainage',
    title: 'Overflowing drain blocking the road edge',
    description:
      'Drain is overflowing with stagnant water and waste. Bad smell and blocked pathway, mosquito risk for nearby residents.',
    severity: 'high',
    lat: 17.3801,
    lng: 78.4989,
    address: 'HAL 2nd Stage, Hyderabad, Telangana',
    status: 'assigned',
    citizen: 0,
    daysAgo: 5,
    team: 'Sanitation Squad 4',
  },
  {
    idx: 6,
    category: 'road_damage',
    title: 'Broken road edge after utility digging',
    description:
      'The road surface was cut for cable work and never properly restored. Loose gravel and an uneven edge remain.',
    severity: 'low',
    lat: 17.3816,
    lng: 78.4846,
    address: 'Central Avenue Road, Hyderabad, Telangana',
    status: 'pending',
    citizen: 1,
    daysAgo: 2,
  },
  {
    idx: 7,
    category: 'pothole',
    title: 'Cluster of potholes near school gate',
    description:
      'Four to five potholes spread across the width of the road right at the school gate. Risky for children getting out of vehicles.',
    severity: 'high',
    lat: 17.3798,
    lng: 78.4795,
    address: 'Near Govt. Higher Primary School, Hyderabad, Telangana',
    status: 'in_progress',
    citizen: 1,
    daysAgo: 6,
    team: 'Road Repair Crew B',
  },
  {
    idx: 8,
    category: 'streetlight',
    title: 'Flickering streetlight near railway crossing',
    description:
      'The light flickers continuously and may be an electrical fault in the pole. Commuters wait here in the dark in the evening.',
    severity: 'medium',
    lat: 17.3866,
    lng: 78.4611,
    address: 'Near Railway Station, Hyderabad, Telangana',
    status: 'resolved',
    citizen: 0,
    daysAgo: 12,
    team: 'Electrical Team 3',
    resolutionNote: 'Faulty LED driver and damaged pole wiring replaced. Light tested and working.',
  },
  {
    idx: 9,
    category: 'manhole',
    title: 'Damaged manhole rim on side lane',
    description:
      'The manhole rim is broken and the cover sits unevenly, producing a loud clatter when vehicles pass over it.',
    severity: 'medium',
    lat: 17.3763,
    lng: 78.4821,
    address: 'Adugodi Lane, Hyderabad, Telangana',
    status: 'assigned',
    citizen: 1,
    daysAgo: 7,
    team: '',
  },
  {
    idx: 10,
    category: 'water_leakage',
    title: 'Leaking valve wasting water near the market',
    description:
      'Water has been leaking from a valve for several days and a pool has formed near the vegetable market entrance.',
    severity: 'medium',
    lat: 17.3844,
    lng: 78.4669,
    address: 'City Market Area, Hyderabad, Telangana',
    status: 'pending',
    citizen: 0,
    daysAgo: 0,
  },
  {
    idx: 11,
    category: 'road_damage',
    title: 'Minor cracks on the service road',
    description:
      'Hairline cracks along the newly laid service road. No hazard yet but may worsen during the rainy season.',
    severity: 'low',
    lat: 17.3912,
    lng: 78.4932,
    address: 'Ulsoor Lake Road, Hyderabad, Telangana',
    status: 'resolved',
    citizen: 1,
    daysAgo: 20,
    team: 'Road Maintenance Cell',
    resolutionNote: 'Cracks sealed with bituminous filler and surface levelled.',
  },
  {
    idx: 12,
    category: 'drainage',
    title: 'Clogged storm drain before the underpass',
    description:
      'Storm drain is clogged with silt and plastic waste. Water collects at the underpass entrance and cars splash pedestrians.',
    severity: 'high',
    lat: 17.3778,
    lng: 78.4943,
    address: 'Ejipura Underpass, Hyderabad, Telangana',
    status: 'pending',
    citizen: 0,
    daysAgo: 1,
  },
];

export async function buildSeedData(): Promise<SeedData> {
  const now = Date.now();
  const users: UserRecord[] = [];
  const passwordCache = new Map<string, string>();

  for (const account of DEMO_ACCOUNTS) {
    let hash = passwordCache.get(account.password);
    if (!hash) {
      hash = await bcrypt.hash(account.password, 10);
      passwordCache.set(account.password, hash);
    }
    users.push({
      id: `demo-user-${account.email.split('@')[0]}`,
      name: account.name,
      email: account.email,
      passwordHash: hash,
      role: account.role,
      createdAt: new Date(now - 30 * 86400000).toISOString(),
    });
  }

  const citizenUsers = users.filter((u) => u.role === 'citizen');
  const adminUsers = users.filter((u) => u.role === 'admin');

  const reports: ReportRecord[] = [];
  const history: StatusHistoryRecord[] = [];
  const notifications: NotificationRecord[] = [];

  const path: Status[] = ['pending', 'assigned', 'in_progress', 'resolved'];

  SPECS.forEach((spec) => {
    const createdAt = new Date(now - spec.daysAgo * 86400000 + spec.idx * 3600000).toISOString();
    const citizen = citizenUsers[spec.citizen];
    const suggestion = suggestPriority({
      category: spec.category,
      severity: spec.severity,
      title: spec.title,
      description: spec.description,
      latitude: spec.lat,
      longitude: spec.lng,
    });
    const priority = spec.priorityOverride || suggestion.priority;
    const reached = path.indexOf(spec.status);
    const reportId = `demo-report-${spec.idx}`;

    const report: ReportRecord = {
      id: reportId,
      complaintId: complaintIdFor(spec.idx),
      citizenId: citizen.id,
      citizenName: citizen.name,
      category: spec.category,
      title: spec.title,
      description: spec.description,
      imageUrl: null,
      imageStorage: 'none',
      latitude: spec.lat,
      longitude: spec.lng,
      address: spec.address,
      severity: spec.severity,
      priority,
      priorityReason:
        spec.priorityOverride != null
          ? `Set manually by administrator (overrode auto-suggestion of ${suggestion.priority}).`
          : suggestion.reason,
      prioritySource: spec.priorityOverride != null ? 'admin' : 'auto',
      status: spec.status,
      department: suggestDepartment(spec.category),
      team: spec.team || '',
      resolutionImageUrl: null,
      resolutionNote: spec.resolutionNote || '',
      isDemo: true,
      createdAt,
      updatedAt: createdAt,
      resolvedAt: spec.status === 'resolved' ? new Date(now - 1 * 86400000).toISOString() : null,
    };
    reports.push(report);

    const admin = adminUsers[spec.idx % adminUsers.length];
    const steps = reached + 1;
    for (let i = 0; i < steps; i++) {
      const prev = i === 0 ? null : path[i - 1];
      const next = path[i];
      const ts = new Date(new Date(createdAt).getTime() + i * 6 * 3600000).toISOString();
      let note = '';
      let changedByName = i === 0 ? citizen.name : admin.name;
      let changedByRole: 'citizen' | 'admin' = i === 0 ? 'citizen' : 'admin';
      if (i === 0) note = 'Complaint submitted by citizen.';
      else if (next === 'assigned') note = `Assigned to ${report.department}${spec.team ? ` (${spec.team})` : ''}.`;
      else if (next === 'in_progress') note = 'Field team dispatched; work started on site.';
      else if (next === 'resolved') note = spec.resolutionNote || 'Issue verified and resolved.';
      history.push({
        id: `demo-history-${spec.idx}-${i}`,
        reportId,
        previousStatus: prev,
        newStatus: next,
        changedById: i === 0 ? citizen.id : admin.id,
        changedByName,
        changedByRole,
        note,
        timestamp: ts,
      });
    }

    notifications.push({
      id: `demo-note-${spec.idx}-citizen`,
      userId: citizen.id,
      complaintId: report.complaintId,
      reportId,
      message: `Your complaint ${report.complaintId} — ${report.title} was submitted successfully.`,
      type: 'submitted',
      read: spec.daysAgo > 3,
      createdAt,
    });
    if (spec.status !== 'pending') {
      notifications.push({
        id: `demo-note-${spec.idx}-assigned`,
        userId: citizen.id,
        complaintId: report.complaintId,
        reportId,
        message: `Complaint ${report.complaintId} has been assigned to ${report.department}.`,
        type: 'assigned',
        read: spec.daysAgo > 3,
        createdAt: new Date(new Date(createdAt).getTime() + 6 * 3600000).toISOString(),
      });
    }
    if (spec.status === 'resolved') {
      notifications.push({
        id: `demo-note-${spec.idx}-resolved`,
        userId: citizen.id,
        complaintId: report.complaintId,
        reportId,
        message: `Complaint ${report.complaintId} has been resolved. Resolution photos and notes are available.`,
        type: 'resolved',
        read: false,
        createdAt: report.resolvedAt!,
      });
    }
  });

  adminUsers.forEach((admin, i) => {
    notifications.push({
      id: `demo-admin-note-${i}`,
      userId: admin.id,
      complaintId: '',
      reportId: '',
      message: `Demo data loaded: ${reports.length} sample complaints are available in the admin dashboard.`,
      type: 'info',
      read: false,
      createdAt: new Date(now - 3600000).toISOString(),
    });
  });

  return { users, reports, history, notifications, seq: reports.length };
}
