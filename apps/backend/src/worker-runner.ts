import { run } from 'graphile-worker';

import { env } from './config/env';
import { tasks } from './worker-tasks';

async function main() {
  await run({
    connectionString: env.DATABASE_URL,
    concurrency: 2,
    taskList: tasks,
  });
}

void main();

