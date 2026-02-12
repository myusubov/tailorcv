import { logger } from '../lib';
import { redisSubscriber } from '../lib/redis';

/**
 * MODULE-BASED JOB NOTIFIER SERVICE
 * Manages Server-Sent Events (SSE) connections and broadcasts
 * job updates from Redis Pub/Sub.
 */

// Private module-level state
const connections: Map<string, Set<(data: any) => void>> = new Map();

/**
 * Initializes the Redis subscriber to listen for job updates
 */
async function initListener() {
  try {
    // Subscribe to Redis channels for job updates
    await redisSubscriber.subscribe('job_updates', 'analysis_job_updates');

    redisSubscriber.on('message', (channel, message) => {
      try {
        const data = JSON.parse(message);
        const jobId = data.id;

        logger.info({ jobId, channel }, 'Received Redis notification');

        broadcast(jobId, data);
      } catch (err) {
        logger.error({ err, message }, 'Failed to parse Redis message');
      }
    });

    redisSubscriber.on('error', (err) => {
      logger.error({ err }, 'Redis subscriber error');
    });

    logger.info('Redis Pub/Sub Listener initialized');
  } catch (err) {
    logger.error({ err }, 'Failed to initialize Redis subscriber');
    throw err;
  }
}

/**
 * Broadcasts data to all active connections for a specific jobId
 */
function broadcast(jobId: string, data: any) {
  const jobConnections = connections.get(jobId);
  if (jobConnections) {
    jobConnections.forEach((cb) => cb(data));
  }
}

/**
 * Safely removes a specific callback from the connection map.
 */
function removeConnection(jobId: string, callback: (data: any) => void) {
  const jobConnections = connections.get(jobId);
  if (jobConnections) {
    jobConnections.delete(callback);
    if (jobConnections.size === 0) {
      connections.delete(jobId);
    }
  }
}

/**
 * PUBLIC API: Adds a new SSE connection for a specific job.
 * Returns an unsubscribe function.
 */
export function addConnection(jobId: string, callback: (data: any) => void) {
  if (!connections.has(jobId)) {
    connections.set(jobId, new Set());
  }
  connections.get(jobId)!.add(callback);

  logger.debug({ jobId }, 'SSE Connection added');

  return () => {
    removeConnection(jobId, callback);
    logger.debug({ jobId }, 'SSE Connection removed');
  };
}

/**
 * PUBLIC API: Publishes a job update to Redis
 * Called by workers and services when job status changes
 */
export async function publishJobUpdate(
  channel: 'job_updates' | 'analysis_job_updates',
  data: any,
) {
  const { redisPublisher } = await import('../lib/redis');

  try {
    await redisPublisher.publish(channel, JSON.stringify(data));
    logger.debug({ channel, jobId: data.id }, 'Published job update to Redis');
  } catch (err) {
    logger.error(
      { err, channel, jobId: data.id },
      'Failed to publish job update to Redis',
    );
  }
}

// Automatically start the listener on first import/module load
initListener();
