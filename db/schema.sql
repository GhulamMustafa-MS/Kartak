-- db/schema.sql - the Kartak database (Postgres on Neon).
--
-- Purpose:    The whole schema; safe to run again (create ... if not exists).
-- Where:      database "kartak" in the Neon project "amigodb" (region aws-eu-west-2), owned by the role
--             kartak_app. Separate database and login from the Amigos data in the same project (decision D8).
-- Used by:    api/*.js through api/_db.js; tests/ load it into an in-memory Postgres.
-- Changes:    Never edit a live table by hand; add a numbered file in db/migrations/ and run it with the
--             Neon console or the Neon MCP tool, then update this file to match (see db/CLAUDE.md).
--
-- kartak_codes:    one row per access code. device_id = the phone it is locked to (null = not used yet).
--                  transfer_token/expires = one-time hand-over to the iPhone home-screen app (decision D13).
--                  valid_days = optional time limit in days from the first use (activated_at); null = no limit
--                  (decision D25). A reset for a new phone does not restart the time.
-- kartak_results:  one row per finished test or block of "All questions" (decision D26): mode full / quick /
--                  practice / all, language, score, and the question ids asked and got wrong (comma separated).
-- kartak_settings: key/value. admin_hash = SHA-256 of the seller password (the password itself is never stored).

create table if not exists kartak_codes (
  code text primary key,
  note text not null default '',
  device_id text,
  disabled boolean not null default false,
  reset_count int not null default 0,
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  last_seen timestamptz,
  transfer_token text,
  transfer_expires timestamptz,
  valid_days int
);
create table if not exists kartak_settings (k text primary key, v text not null);
create table if not exists kartak_results (
  id bigserial primary key,
  client_id text unique not null,
  code text not null references kartak_codes (code) on delete cascade,
  mode text not null,
  lang text not null default '',
  total int not null,
  correct int not null,
  timed_out int not null default 0,
  seconds int,
  asked text not null default '',
  wrong text not null default '',
  finished_at timestamptz not null default now()
);
create index if not exists kartak_results_code on kartak_results (code, finished_at desc);
