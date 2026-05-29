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
  document_upload_status text not null default 'NOT_UPLOADED',
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
  sub_city text,
  woreda text,
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
alter table application_documents add column if not exists cloudinary_secure_url text;
alter table application_documents add column if not exists cloudinary_public_id text;
alter table application_documents add column if not exists cloudinary_format text;
alter table application_documents add column if not exists original_file_name text;
alter table application_documents add column if not exists original_file text;
alter table application_documents add column if not exists uploaded_at timestamptz not null default now();
update application_documents
set original_file_name = file_name
where original_file_name is null;
update application_documents
set original_file = coalesce(original_file_name, file_name)
where original_file is null;
update application_documents
set cloudinary_secure_url = file_path
where cloudinary_secure_url is null and file_path ilike 'https://res.cloudinary.com/%';
alter table users drop constraint if exists users_subcity_required;
alter table users add constraint users_subcity_required check (coalesce(trim(sub_city), '') <> '') not valid;
alter table users drop constraint if exists users_phone_required;
alter table users add constraint users_phone_required check (coalesce(trim(phone), '') <> '') not valid;
alter table announcements add column if not exists category text not null default 'general';
alter table announcements add column if not exists published boolean not null default true;
alter table announcements add column if not exists sub_city text;
alter table announcements add column if not exists woreda text;
alter table users add column if not exists sub_city text;
alter table users add column if not exists woreda text;
alter table users add column if not exists phone text;
alter table users add column if not exists address text;
alter table users add column if not exists is_active boolean not null default true;
alter table users drop constraint if exists users_role_check;
alter table users add constraint users_role_check check (role in ('super_admin', 'admin', 'staff', 'citizen'));

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
  full_name text,
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

-- Migrate existing core_identity_data into citizen_profiles if table exists
do $$ begin
  if exists (select 1 from information_schema.tables where table_name = 'core_identity_data') then
    update citizen_profiles cp
    set full_name    = coalesce(cp.full_name,    cid.full_name),
        sex          = coalesce(cp.sex,          cid.sex),
        date_of_birth= coalesce(cp.date_of_birth,cid.date_of_birth),
        mother_name  = coalesce(cp.mother_name,  cid.mother_name),
        father_name  = coalesce(cp.father_name,  cid.father_name),
        phone_number = coalesce(cp.phone_number, cid.phone_number),
        email        = coalesce(cp.email,        cid.email),
        photo_url    = coalesce(cp.photo_url,    cid.photo_url),
        nationality  = coalesce(cp.nationality,  cid.nationality),
        sub_city     = coalesce(cp.sub_city,     cid.sub_city),
        woreda       = coalesce(cp.woreda,       cid.woreda),
        address      = coalesce(cp.address,      cid.address),
        updated_at   = now()
    from core_identity_data cid
    where cid.profile_id = cp.id;
    drop table core_identity_data;
  end if;
end $$;

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

create table if not exists form_templates (
  id bigserial primary key,
  service_slug text not null unique,
  service_name text not null,
  fields jsonb not null default '[]'::jsonb,
  version int not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed default form templates for each service
insert into form_templates (service_slug, service_name, fields) values
  ('birth-certificate', 'Birth Certificate', '[{"name":"childName","label":"Child''s full name","type":"text"},{"name":"dateOfBirth","label":"Date of birth","type":"date"},{"name":"placeOfBirth","label":"Place of birth","type":"text"},{"name":"fatherName","label":"Father''s full name","type":"text"},{"name":"motherName","label":"Mother''s full name","type":"text"}]'),
  ('marriage-certificate', 'Marriage Certificate', '[{"name":"partnerOne","label":"Partner 1 full name","type":"text"},{"name":"partnerTwo","label":"Partner 2 full name","type":"text"},{"name":"weddingDate","label":"Wedding date","type":"date"},{"name":"venue","label":"Wedding venue","type":"text"}]'),
  ('divorce-certificate', 'Divorce Certificate', '[{"name":"partnerOne","label":"Partner 1 full name","type":"text"},{"name":"partnerTwo","label":"Partner 2 full name","type":"text"},{"name":"courtCaseNumber","label":"Court case number","type":"text"},{"name":"decreeDate","label":"Decree date","type":"date"}]'),
  ('death-certificate', 'Death Certificate', '[{"name":"deceasedName","label":"Deceased full name","type":"text"},{"name":"dateOfDeath","label":"Date of death","type":"date"},{"name":"placeOfDeath","label":"Place of death","type":"text"},{"name":"cause","label":"Cause (as recorded)","type":"text"}]'),
  ('id-services', 'Residence ID Services', '[{"name":"reason","label":"Reason (new / renewal / replacement)","type":"text"},{"name":"currentIdNumber","label":"Current Residence ID number (if any)","type":"text"}]'),
  ('residency-transfer', 'Residency Transfer Certificate', '[{"name":"previousAddress","label":"Previous address","type":"text"},{"name":"newAddress","label":"New address","type":"text"},{"name":"reason","label":"Reason for transfer","type":"textarea"}]'),
  ('certificate-of-no-impediment', 'Certificate of No Impediment', '[{"name":"applicantName","label":"Applicant full name","type":"text"},{"name":"intendedSpouse","label":"Intended spouse full name","type":"text"},{"name":"purpose","label":"Purpose / country of use","type":"text"}]'),
  ('residency-proof-letter', 'Residency Proof Letter', '[{"name":"residenceAddress","label":"Residence address","type":"text"},{"name":"purpose","label":"Purpose","type":"textarea"}]')
on conflict (service_slug) do nothing;

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
