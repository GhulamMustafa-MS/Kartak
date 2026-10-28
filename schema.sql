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
