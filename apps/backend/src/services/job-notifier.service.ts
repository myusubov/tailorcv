import { Client } from 'pg';
import { logger } from '../lib';
import { env } from '../config/env';

/**
 * MODULE-BASED JOB NOTIFIER SERVICE
 * Manages Server-Sent Events (SSE) connections and broadcasts 
 * database notifications from Postgres LISTEN/NOTIFY.
 */

// Private module-level state
let listenerClient: Client | null = null;
const connections: Map<string, Set<(data: any) => void>> = new Map();

/**
 * Initializes (or re-initializes) the persistent Postgres listener.
 */
async function initListener() {
  const connectionString = env.DATABASE_URL;
  
  listenerClient = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await listenerClient.connect();
    
    // Subscribe to database-level notification channels.
    await listenerClient.query('LISTEN job_updates; LISTEN analysis_job_updates;');
    
    listenerClient.on('notification', (msg) => {
      if (!msg.payload) return;
      
      try {
        const data = JSON.parse(msg.payload);
        const jobId = data.id;
        
        logger.info({ jobId, channel: msg.channel }, 'Received DB notification');
        
        broadcast(jobId, data);
      } catch (err) {
        logger.error({ err, payload: msg.payload }, 'Failed to parse notification payload');
      }
    });

    listenerClient.on('error', (err) => {
      logger.error({ err }, 'Postgres listener error');
      reconnect();
    });

    logger.info('Postgres Notification Listener initialized');
  } catch (err) {
    logger.error({ err }, 'Failed to connect Postgres Listener');
    reconnect();
  }
}

/**
 * Self-healing: try to reconnect after a failure.
 */
function reconnect() {
  setTimeout(() => initListener(), 5000);
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

// Automatically start the listener on first import/module load
initListener();
