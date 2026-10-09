import dotenv from 'dotenv';
import path from 'path';

// Load .env from the project root first, then from the backend directory (later wins).
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  mongoUri: (process.env.MONGODB_URI || '').trim(),
  cloudinary: {
    cloudName: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
    apiKey: (process.env.CLOUDINARY_API_KEY || '').trim(),
    apiSecret: (process.env.CLOUDINARY_API_SECRET || '').trim(),
  },
  ai: {
    apiKey: (process.env.AI_API_KEY || '').trim(),
    baseUrl: (process.env.AI_BASE_URL || 'https://api.openai.com/v1').trim().replace(/\/$/, ''),
    model: process.env.AI_MODEL || 'gpt-4o-mini',
  },
  seedDemo: bool(process.env.SEED_DEMO, true),
};

export type Env = typeof env;
export default env;
