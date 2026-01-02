import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

async function applyFix() {
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
    console.log('Applying SQL fix to database...');
    await prisma.$executeRawUnsafe(query);
    console.log('✅ Successfully updated notify_job_update function.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to apply fix:', err);
    process.exit(1);
  }
}

applyFix();
