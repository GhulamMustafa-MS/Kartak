-- db/migrations/002_transfer_token.sql - iPhone home-screen hand-over (decision D13, run 28 Oct 2026).
alter table kartak_codes
  add column if not exists transfer_token text,
  add column if not exists transfer_expires timestamptz;
