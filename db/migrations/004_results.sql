-- db/migrations/004_results.sql - test results for the seller's analytics (decision D26, run 28 Oct 2026).
--
-- Purpose:  One row per finished test (full mock, quick test, practice) or per block of "All questions",
--           sent by the worker app for its code. asked / wrong = question ids (k001,k002,...), comma separated,
--           so the seller app can show weak topics and the questions people miss most. client_id stops the
--           same result being saved twice when the phone retries. Rows go when their code is deleted.
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
