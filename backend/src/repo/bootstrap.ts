import mongoose from 'mongoose';
import env from '../config/env';
import { setRepo, Repo } from './index';
import { createMemoryRepo } from './memory';
import { createMongoRepo } from './mongo';
import { buildSeedData, DEMO_ACCOUNTS } from './seed';

export interface RepoInit {
  repo: Repo;
  demoMode: boolean;
  notice: string;
}

export async function initRepo(): Promise<RepoInit> {
  if (env.mongoUri) {
    try {
      await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 8000 });
      const repo = createMongoRepo();
      setRepo(repo);
      console.log('[db] Connected to MongoDB Atlas');
      return {
        repo,
        demoMode: false,
        notice: 'Connected to MongoDB. Reports are stored persistently.',
      };
    } catch (error) {
      console.warn('[db] MongoDB connection failed, falling back to demo mode:', (error as Error).message);
    }
  }

  let seed;
  if (env.seedDemo) {
    seed = await buildSeedData();
    console.log(`[db] Demo mode seeded with ${seed.reports.length} sample complaints and ${seed.users.length} demo accounts`);
  }
  const repo = createMemoryRepo(seed);
  setRepo(repo);
  return {
    repo,
    demoMode: true,
    notice: env.mongoUri
      ? 'MongoDB was not reachable. Running in DEMO MODE — data is in memory only and will reset on restart.'
      : 'No MongoDB URI configured. Running in DEMO MODE with sample data — data is in memory only and will reset on restart.',
  };
}

export { DEMO_ACCOUNTS };
