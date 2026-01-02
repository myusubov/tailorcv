import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Force load env
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function applyFix() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  const query = `
    CREATE OR REPLACE FUNCTION notify_job_update() RETURNS trigger AS $$
    DECLARE
      payload JSON;
    BEGIN
      payload = json_build_object(
        'id', NEW.id,
        'userId', NEW."userId",
        'status', NEW.status,
        'stage', NEW.stage,
        'progressPct', NEW."progressPct",
        'resultBaseResumeId', NEW."resultBaseResumeId",
        'error', NEW.error
      );

      PERFORM pg_notify('job_updates', payload::text);
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected. Applying SQL fix...');
    await client.query(query);
    console.log('✅ Successfully updated notify_job_update function.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to apply fix via PG client:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyFix();
