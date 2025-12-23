import { makeWorkerUtils, type WorkerUtils } from 'graphile-worker';
import { env } from '../config/env';

let workerUtilsPromise: Promise<WorkerUtils> | null = null;

export function getWorkerUtils() {
  if (!workerUtilsPromise) {
    workerUtilsPromise = makeWorkerUtils({
      connectionString: env.DATABASE_URL,
    });
  }
  return workerUtilsPromise;
}
