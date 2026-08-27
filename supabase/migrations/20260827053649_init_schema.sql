-- ============================================================
-- Veris Helpdesk — Final Core MVP Schema (Supabase / Postgres)
-- Scope: Submit a ticket, Track a ticket, Reply to a ticket,
--        + Notifications inbox (confirmed by leads)
-- Excludes Post-MVP: categories CRUD, activity_log table,
-- admin roles, internal notes, merge tickets, etc.
-- ============================================================

-- ---------- ENUMS ----------

create type user_type as enum ('subscriber', 'student');

create type ticket_status as enum (
  'new',
  'open',
  'in_progress',
  'waiting_for_client',
  'resolved',
  'closed'
);

create type priority_level as enum ('low', 'medium', 'high', 'urgent');

create type message_sender as enum ('client', 'admin');


-- ---------- ADMINS ----------
-- Single flat admin table for MVP — no roles table (post-mvp).

create table admins (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  password_hash text not null,           -- if not using Supabase Auth directly
  full_name     text not null,
  created_at    timestamptz not null default now()
);


-- ---------- TICKETS ----------

create table tickets (
  id               uuid primary key default gen_random_uuid(),
  ticket_number    text unique not null,        -- e.g. TKT-00124, generated on insert

  -- submitter info (no client accounts for MVP — email is the identifier)
  full_name        text not null,
  email            text not null,
  user_type        user_type not null,

  -- issue details
  service          text not null,               -- fixed dropdown list, no CRUD table for MVP
  subject          text not null,
  description      text not null,

  -- triage
  priority         priority_level not null,      -- client-selected initial value
  status           ticket_status not null default 'new',

  -- consent
  consent_given    boolean not null default false,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_tickets_email on tickets (email);
create index idx_tickets_status on tickets (status);
create index idx_tickets_ticket_number on tickets (ticket_number);


-- ---------- MESSAGES (conversation thread) ----------

create table messages (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references tickets(id) on delete cascade,
  sender_type message_sender not null,
  admin_id    uuid references admins(id),        -- null if sender_type = 'client'
  body        text not null,
  created_at  timestamptz not null default now()
);

create index idx_messages_ticket_id on messages (ticket_id);


-- ---------- ATTACHMENTS ----------
-- Can attach to the original ticket submission OR a specific reply message.

create table attachments (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references tickets(id) on delete cascade,
  message_id  uuid references messages(id) on delete cascade,  -- null = attached at submission
  file_name   text not null,
  file_type   text not null,
  file_size   integer not null,                  -- bytes, enforce limit at upload handler
  storage_path text not null,                     -- Supabase Storage path
  created_at  timestamptz not null default now()
);

create index idx_attachments_ticket_id on attachments (ticket_id);


-- ---------- OTP VERIFICATIONS (for "View My Tickets" access) ----------

create table otp_verifications (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  code        text not null,
  expires_at  timestamptz not null,               -- short TTL, e.g. now() + interval '10 minutes'
  used        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index idx_otp_email on otp_verifications (email);


-- ---------- NOTIFICATIONS (admin dashboard inbox) ----------
-- Confirmed scope: new ticket submitted + client reply received.
-- Fires an in-app row here AND a Resend email (handled in the
-- notify-admin-ticket edge function), same pattern as
-- notify-subscription.

create table notifications (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid references tickets(id) on delete cascade,
  message     text not null,          -- e.g. "New ticket TKT-00124 submitted"
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index idx_notifications_is_read on notifications (is_read);
create index idx_notifications_ticket_id on notifications (ticket_id);


-- ---------- updated_at trigger for tickets ----------

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_tickets_updated_at
before update on tickets
for each row execute function set_updated_at();


-- ============================================================
-- NOTE: Row Level Security (RLS) still needs to be enabled and
-- policies written before this goes to production — Supabase
-- tables are open by default. Flagging separately since RLS
-- design is its own task, not bundled into this schema file.
--
-- NOTE: notifications insert points still need to be wired into
-- the create-ticket endpoint and client-reply endpoint — this
-- file only defines the table, not the trigger/hook logic.
-- ============================================================