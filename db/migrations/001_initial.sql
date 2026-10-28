-- db/migrations/001_initial.sql - first version of the tables (run 28 Oct 2026).
create table if not exists kartak_codes (
  code text primary key,
  note text not null default '',
  device_id text,
  disabled boolean not null default false,
  reset_count int not null default 0,
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  last_seen timestamptz
);
create table if not exists kartak_settings (k text primary key, v text not null);
