-- Rate limiting table for API endpoints
-- Used by src/lib/rate-limit.ts across serverless instances

create table if not exists rate_limits (
  id bigint generated always as identity primary key,
  key text not null,
  created_at timestamptz not null default now()
);

-- Index for fast lookups by key + time window
create index idx_rate_limits_key_created on rate_limits (key, created_at desc);

-- Auto-cleanup: delete entries older than 2 hours (runs via pg_cron or manual)
-- For now, a simple function that can be called periodically:
create or replace function cleanup_rate_limits()
returns void as $$
begin
  delete from rate_limits where created_at < now() - interval '2 hours';
end;
$$ language plpgsql;

-- RLS: only service role can access (API routes use server client)
alter table rate_limits enable row level security;
