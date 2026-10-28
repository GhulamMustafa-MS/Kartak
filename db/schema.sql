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
  transfer_expires timestamptz
);
create table if not exists kartak_settings (k text primary key, v text not null);
