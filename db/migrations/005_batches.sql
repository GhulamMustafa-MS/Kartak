-- db/migrations/005_batches.sql - bunches of codes made together (decision D33, run 30 Oct 2026).
--
-- Purpose:  batch = the same id on every code the seller made in one go ("Make 5 codes"), so the seller app can
--           show them together and turn off, turn on or delete the whole bunch at once. null = made on its own.
alter table kartak_codes add column if not exists batch text;
create index if not exists kartak_codes_batch on kartak_codes (batch) where batch is not null;
