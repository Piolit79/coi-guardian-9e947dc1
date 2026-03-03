-- Schedule daily COI reminder emails at 9:00 AM UTC
SELECT cron.schedule(
  'coi-daily-reminders',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://rmgzjnmyvowdhhrdssdx.supabase.co/functions/v1/coi-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtZ3pqbm15dm93ZGhocmRzc2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzg3NTksImV4cCI6MjA4Nzk1NDc1OX0.-1ysf7NkBGu3MP-R6mkKYB7cJgGWs1Q4_NEf_Qmy_bQ'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
