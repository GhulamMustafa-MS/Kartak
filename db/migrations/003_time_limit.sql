-- db/migrations/003_time_limit.sql - optional time limit per code (decision D25, run 28 Oct 2026).
--
-- Purpose:  valid_days = how many days the code works, counted from the first time a phone uses it
--           (activated_at). null = no limit. The API refuses the code once activated_at + valid_days has
--           passed; the seller can change or remove the limit at any time.
alter table kartak_codes add column if not exists valid_days int;
