create extension if not exists pgcrypto;

create table if not exists users (
  id bigserial primary key,
  full_name text not null,
  email text unique not null,
  password_hash text not null,
  role text not null check (role in ('citizen', 'staff')),
  created_at timestamptz not null default now()
);

create table if not exists applications (
  id bigserial primary key,
  citizen_id bigint not null references users(id),
  service_type text not null,
  office_code text not null,
  form_data jsonb not null default '{}'::jsonb,
  status text not null default 'Submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists application_documents (
  id bigserial primary key,
  application_id bigint not null references applications(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  mime_type text not null,
  file_size bigint not null,
  created_at timestamptz not null default now()
);

create table if not exists application_status_history (
  id bigserial primary key,
  application_id bigint not null references applications(id) on delete cascade,
  status text not null,
  comment text,
  changed_by bigint references users(id),
  changed_at timestamptz not null default now()
);

create table if not exists appointment_slots (
  id bigserial primary key,
  office_code text not null,
  slot_date date not null,
  start_time time not null,
  end_time time not null,
  capacity int not null check (capacity > 0),
  created_at timestamptz not null default now()
);

create table if not exists appointments (
  id bigserial primary key,
  application_id bigint not null references applications(id) on delete cascade,
  citizen_id bigint not null references users(id),
  slot_id bigint not null references appointment_slots(id),
  queue_number int not null,
  status text not null default 'Scheduled',
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id bigserial primary key,
  user_id bigint not null references users(id),
  channel text not null check (channel in ('sms', 'email', 'in_app')),
  title text not null,
  body text not null,
  status text not null check (status in ('queued', 'sent', 'failed')),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists announcements (
  id bigserial primary key,
  title text not null,
  body text not null,
  posted_by bigint references users(id),
  created_at timestamptz not null default now()
);

create table if not exists complaints (
  id bigserial primary key,
  citizen_id bigint not null references users(id),
  category text not null,
  message text not null,
  status text not null check (status in ('Open', 'In Progress', 'Resolved')) default 'Open',
  resolution_comment text,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_applications_citizen on applications(citizen_id);
create index if not exists idx_applications_status on applications(status);
create index if not exists idx_notifications_user on notifications(user_id);
create index if not exists idx_appointments_slot on appointments(slot_id);

alter table application_documents add column if not exists verified boolean not null default false;
alter table announcements add column if not exists category text not null default 'general';
alter table users add column if not exists sub_city text;
alter table users add column if not exists woreda text;
alter table users add column if not exists phone text;
alter table users add column if not exists address text;
alter table users add column if not exists email_verified boolean not null default true;
alter table users add column if not exists is_active boolean not null default true;
alter table users drop constraint if exists users_role_check;
alter table users add constraint users_role_check check (role in ('super_admin', 'admin', 'staff', 'citizen'));

create table if not exists email_verification_tokens (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id bigserial primary key,
  actor_user_id bigint references users(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists citizen_profiles (
  id bigserial primary key,
  user_id bigint not null unique references users(id) on delete cascade,
  profile_number text not null unique default ('PRF-' || upper(substr(gen_random_uuid()::text, 1, 12))),
  identity_number text not null unique default ('IDN-' || upper(substr(gen_random_uuid()::text, 1, 12))),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists core_identity_data (
  id bigserial primary key,
  profile_id bigint not null unique references citizen_profiles(id) on delete cascade,
  full_name text not null,
  sex text,
  date_of_birth date,
  mother_name text,
  father_name text,
  phone_number text,
  email text,
  photo_url text,
  nationality text,
  sub_city text,
  woreda text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists households (
  id bigserial primary key,
  household_id text not null unique default ('HH-' || upper(substr(gen_random_uuid()::text, 1, 10))),
  sub_city text,
  woreda text,
  address text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists household_members (
  id bigserial primary key,
  household_pk bigint not null references households(id) on delete cascade,
  profile_id bigint not null references citizen_profiles(id) on delete cascade,
  relation text not null default 'member',
  created_at timestamptz not null default now(),
  unique (household_pk, profile_id)
);

alter table applications add column if not exists reference_number text;
update applications
set reference_number = 'APP-' || to_char(created_at, 'YYYY') || '-' || lpad(id::text, 7, '0')
where reference_number is null;
alter table applications alter column reference_number set default ('APP-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('applications_id_seq')::text, 7, '0'));
create unique index if not exists idx_applications_reference_number on applications(reference_number);

-- Demo appointment slots (used by /api/appointments/available)
insert into appointment_slots (office_code, slot_date, start_time, end_time, capacity)
select seed.office, seed.slot_date, seed.start_time, seed.end_time, seed.capacity
from (
  select v.office, d::date as slot_date, v.start_t as start_time, v.end_t as end_time, 25 as capacity
  from (values
    ('Addis Ababa — Bole Sub-City', time '09:30', time '10:00'),
    ('Addis Ababa — Bole Sub-City', time '10:00', time '10:30'),
    ('Addis Ababa — Bole Sub-City', time '10:30', time '11:00'),
    ('Addis Ababa — Kirkos Sub-City', time '09:30', time '10:00'),
    ('Addis Ababa — Kirkos Sub-City', time '14:00', time '14:30'),
    ('Addis Ababa — Yeka Sub-City', time '10:00', time '10:30'),
    ('Bahir Dar - Central CRRSA', time '09:00', time '09:30'),
    ('Hawassa - Central CRRSA', time '15:00', time '15:30')
  ) as v(office, start_t, end_t)
  cross join generate_series(current_date + 1, current_date + 21, interval '1 day') as d
) seed
where not exists (
  select 1 from appointment_slots x
  where x.office_code = seed.office
    and x.slot_date = seed.slot_date
    and x.start_time = seed.start_time
);
