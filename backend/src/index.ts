import env from './config/env';
import { createApp } from './app';
import { DEMO_ACCOUNTS, initRepo } from './repo/bootstrap';

async function main() {
  const init = await initRepo();

  const app = createApp({
    demoMode: init.demoMode,
    notice: init.notice,
    demoAccounts: init.demoMode
      ? DEMO_ACCOUNTS.map(({ role, email, password }) => ({ role, email, password }))
      : undefined,
  });

  app.listen(env.port, () => {
    console.log(`\n  CivicConnect API listening on http://localhost:${env.port}`);
    console.log(`  Mode: ${init.demoMode ? 'DEMO (in-memory, not persistent)' : 'PRODUCTION (MongoDB)'}`);
    console.log(`  ${init.notice}\n`);
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
