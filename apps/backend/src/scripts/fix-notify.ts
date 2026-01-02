import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function fixNotificationFunction() {
  console.log('Connecting to database...');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // For local dev/neon
  });

  try {
    await client.connect();
    console.log('Connected.');

    const query = `
      CREATE OR REPLACE FUNCTION notify_job_update() RETURNS trigger AS $$
      DECLARE
        payload JSON;
      BEGIN
        -- Construct the notification payload with relevant fields
        -- UPDATED: Added resultBaseResumeId and error
        payload = json_build_object(
          'id', NEW.id,
          'userId', NEW."userId",
          'status', NEW.status,
          'stage', NEW.stage,
          'progressPct', NEW."progressPct",
          'resultBaseResumeId', NEW."resultBaseResumeId",
          'error', NEW.error
        );

        -- Notify the channel 'job_updates'
        PERFORM pg_notify('job_updates', payload::text);
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    console.log('Replacing function notify_job_update...');
    await client.query(query);
    console.log('Successfully updated notification function.');

  } catch (err) {
    console.error('Failed to update function:', err);
  } finally {
    await client.end();
  }
}

fixNotificationFunction();
