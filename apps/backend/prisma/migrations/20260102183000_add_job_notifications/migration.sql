-- Create function to notify on onboarding job updates
CREATE OR REPLACE FUNCTION notify_job_update() RETURNS trigger AS $$
DECLARE
  payload JSON;
BEGIN
  -- Construct the notification payload with relevant fields
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

-- Attach trigger to onboarding_jobs table
DROP TRIGGER IF EXISTS trg_onboarding_job_update ON onboarding_jobs;
CREATE TRIGGER trg_onboarding_job_update
AFTER INSERT OR UPDATE ON onboarding_jobs
FOR EACH ROW
EXECUTE FUNCTION notify_job_update();

-- Create function to notify on analysis job updates
CREATE OR REPLACE FUNCTION notify_analysis_job_update() RETURNS trigger AS $$
DECLARE
  payload JSON;
BEGIN
  payload = json_build_object(
    'id', NEW.id,
    'userId', NEW."userId",
    'status', NEW.status
  );

  PERFORM pg_notify('analysis_job_updates', payload::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to analysis_jobs table
DROP TRIGGER IF EXISTS trg_analysis_job_update ON analysis_jobs;
CREATE TRIGGER trg_analysis_job_update
AFTER INSERT OR UPDATE ON analysis_jobs
FOR EACH ROW
EXECUTE FUNCTION notify_analysis_job_update();
