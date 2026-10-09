import { z } from 'zod';

export const emptyToUndefined = (value: unknown) =>
  value === '' || value === undefined || value === null ? undefined : value;

const optionalNumber = z.preprocess(
  emptyToUndefined,
  z.coerce.number().min(-90).max(90).optional()
);

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(120),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1).max(120),
  password: z.string().min(1, 'Password is required').max(72),
});

export const reportCreateSchema = z
  .object({
    category: z.enum(['pothole', 'road_damage', 'streetlight', 'manhole', 'water_leakage', 'drainage', 'other']),
    title: z.string().trim().min(5, 'Title must be at least 5 characters').max(120),
    description: z.string().trim().min(10, 'Please describe the issue in at least 10 characters').max(2000),
    severity: z.preprocess(emptyToUndefined, z.enum(['low', 'medium', 'high']).optional()).default('medium'),
    latitude: z.preprocess(
      emptyToUndefined,
      z.coerce.number().min(-90).max(90).nullable().optional()
    ),
    longitude: z.preprocess(
      emptyToUndefined,
      z.coerce.number().min(-180).max(180).nullable().optional()
    ),
    address: z.preprocess(emptyToUndefined, z.string().trim().max(200).optional()).default(''),
  })
  .refine((v) => (v.latitude == null) === (v.longitude == null), {
    message: 'Provide both latitude and longitude, or neither',
    path: ['latitude'],
  });

export const statusUpdateSchema = z.object({
  status: z.enum(['pending', 'assigned', 'in_progress', 'resolved']),
  note: z.preprocess(emptyToUndefined, z.string().trim().max(500).optional()).default(''),
  resolutionNote: z.preprocess(emptyToUndefined, z.string().trim().max(1000).optional()).default(''),
});

export const assignSchema = z.object({
  department: z.string().trim().min(2, 'Department is required').max(80),
  team: z.preprocess(emptyToUndefined, z.string().trim().max(80).optional()).default(''),
});

export const prioritySchema = z.object({
  priority: z.enum(['high', 'medium', 'low']),
  reason: z.preprocess(emptyToUndefined, z.string().trim().max(300).optional()).default(''),
});

export const textAssistSchema = z.object({
  text: z.string().trim().min(3, 'Provide some text first').max(3000),
});

export const reportListQuerySchema = z.object({
  q: z.preprocess(emptyToUndefined, z.string().max(120).optional()),
  category: z.preprocess(emptyToUndefined, z.string().max(40).optional()),
  status: z.preprocess(emptyToUndefined, z.string().max(40).optional()),
  priority: z.preprocess(emptyToUndefined, z.string().max(20).optional()),
  department: z.preprocess(emptyToUndefined, z.string().max(80).optional()),
  from: z.preprocess(emptyToUndefined, z.string().max(30).optional()),
  to: z.preprocess(emptyToUndefined, z.string().max(30).optional()),
  sort: z.preprocess(emptyToUndefined, z.string().max(30).optional()),
  order: z.preprocess(emptyToUndefined, z.enum(['asc', 'desc']).optional()),
  page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).optional()),
  limit: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(100).optional()),
});
