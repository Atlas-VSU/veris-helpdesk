# VERIS Helpdesk

A ticketing system for VERIS clients (subscribers and students) to submit support requests, track their status, and get replies from VERIS admins — with an admin dashboard for managing incoming tickets.

**Scope note:** This project's feature list was deliberately trimmed to a Core MVP after team lead feedback ("keep it simple," "don't over-engineer"). The bar for v1 is: clients can **submit** a ticket, **track** its status, and **receive replies**. Anything beyond that lives in the Post-MVP backlog — see [Feature Scope](#feature-scope) below.

---

## Tech Stack

- **Framework**: Next.js (App Router), TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend / Database**: Supabase (Postgres, Auth, Storage, Edge Functions)
- **Email**: Resend (ticket confirmations, OTP codes, admin notifications)
- **Forms & Validation**: React Hook Form + Zod (schemas live in `features/<domain>/schemas/`, see [Repository Architecture](#repository-architecture))
- **Migrations**: Supabase CLI (migration-first workflow — see [Database Setup](#database-setup))

---

## Repository Architecture

```text
app/                              # Next.js App Router (Routes & Layouts)
├── (public)/                     # Client-facing routes (route group)
│   ├── page.tsx                  # Landing page
│   ├── privacy/                  # Privacy Policy
│   ├── submit-ticket/            # Submit Ticket Form
│   ├── verify/                   # Email Verification (OTP)
│   └── tickets/                  # My Tickets Dashboard
│       └── [ticketNumber]/       # Single ticket view
├── admin/
│   ├── login/                    # Admin Login
│   └── (protected)/              # Auth-gated admin routes (route group)
│       ├── dashboard/            # Admin Dashboard (stats, notifications inbox)
│       ├── tickets/              # Tickets Management (search, filter, table)
│       │   └── [ticketNumber]/   # Admin Ticket Workspace (thread, reply, status)
│       ├── clients/              # Client records
│       ├── categories/           # Ticket categories
│       └── admins/               # Admin account management
├── api/
│   └── admin/login/              # Admin login endpoint (Zod-validated)
├── layout.tsx
components/
└── ui/                            # Shared UI primitives (button, card, ...)
features/                          # Feature-scoped logic, grouped by domain
├── landing/                       # components/, data/, types/ for the landing page
├── tickets/
│   └── schemas/                   # Zod schemas — create ticket, request/verify OTP
└── admin/
    └── schemas/                   # Zod schemas — admin login
lib/
├── supabase-server.ts             # Supabase service-role client (server-side only)
├── rate-limit.ts                  # Rate-limiting middleware
└── utils.ts
types/
└── database.ts                    # Shared DB row types
supabase/
├── config.toml
└── migrations/                    # Versioned schema migrations (source of truth for DB)
```

**Convention:** feature-specific logic (validation schemas, and eventually feature-scoped components/hooks) lives under `features/<domain>/`, following the pattern already established by `features/landing/`. Shared, non-feature-specific code (Supabase clients, generic utilities) stays in `lib/`.

---

## Feature Scope

### Core MVP

**Client-facing**

- Landing page (nav, hero, submit/track CTAs, expected response time, footer)
- Submit Ticket Form (name, email, user type, service, subject, description, priority, attachment, consent, CAPTCHA)
- Email Verification (OTP) to access "My Tickets"
- Submission Confirmation (ticket number, summary, next actions)
- My Tickets Dashboard (status filter, search, ticket cards)

**Admin-facing**

- Admin Login
- Admin Dashboard (ticket totals, urgent count, status breakdown, recent tickets, **notifications inbox**)
- Tickets Management (search, status filter, table, pagination)
- Admin Ticket Workspace (conversation thread, reply-to-client with auto-email, attach file to reply, change status/priority, resolve/request-info actions)

**Backend**

- DB schema (see [Database Setup](#database-setup))
- Ticket number generator
- Client OTP verification, Admin login, session timeout, route auth middleware, rate limiting
- Server-side validation (fields, email format, CAPTCHA, attachment type/size)
- Create ticket endpoint, attachment upload handler, Supabase Storage integration
- Ticket confirmation email (Resend)
- Get/list/filter/search tickets, update status, override priority, change category, close/reopen
- Client + admin reply endpoints, auto-email on admin reply
- Notifications: insert on new ticket + client reply, list/mark-read/delete endpoints, admin notification email (Resend)
- Input validation middleware, centralized error handling

### Post-MVP (explicitly deferred)

Categories CRUD, activity log (table + panel), admin roles / role-based access, admin account management UI, admin password reset (custom-built), admin login lockout (custom-built), internal notes, assign/reassign admin, merge duplicate tickets, sort tickets, status-change email, client profile card, CSV/PDF export, scheduled DB backup, data retention rules automation.

> Rationale: these were cut to match leads' "submit / track / reply, keep it simple" guidance. Most rely on Supabase's built-in tooling in the meantime (e.g. Supabase Auth covers password reset and login lockout; Supabase itself handles automated backups on paid tiers).

---

## Database Setup

Schema lives in `supabase/migrations/` — **not** the dashboard SQL editor. Always add new schema changes as a migration file first, then push, so migration history stays in sync with the repo (a past feature hit painful schema drift doing it dashboard-first — don't repeat that).

### Tables

| Table               | Purpose                                                              |
| ------------------- | -------------------------------------------------------------------- |
| `admins`            | Flat admin accounts (no roles for MVP)                               |
| `tickets`           | Core ticket record — submitter info, issue details, priority, status |
| `messages`          | Conversation thread — client and admin replies                       |
| `attachments`       | Files linked to a ticket or a specific message                       |
| `otp_verifications` | Email OTP codes for the "My Tickets" access flow                     |
| `notifications`     | Admin dashboard inbox — new ticket / client reply events             |

### Enums

`user_type` (subscriber, student) · `ticket_status` (new, open, in_progress, waiting_for_client, resolved, closed) · `priority_level` (low, medium, high, urgent) · `message_sender` (client, admin)

### Workflow

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase migration new <migration_name>
# edit the generated .sql file in supabase/migrations/
supabase db push
```

### Known open items

- **RLS policies are not yet written.** Tables are open by default — this must be done before any real data touches the project.
- **Notification insert hooks** still need to be wired into the create-ticket and client-reply endpoints — the `notifications` table exists but nothing writes to it yet.
- **Attachment restriction**: images (jpg, png) and PDFs only, 10MB max per file — enforced in the upload handler, not the database.

---

## Run Locally

### Prerequisites

- Node.js (v18+ recommended)
- npm
- Supabase CLI (`npm install supabase --save-dev`)

### Setup Steps

1. **Install dependencies**:

```bash
   npm install
```

2. **Configure environment variables**:
   Copy `.env.example` to `.env.local`, then fill in the values shared in the team's Discord/Messenger group.

   > Env vars change frequently as new features are added (Resend keys, JWT secret, etc.) — always check the group for the latest values rather than relying on old ones you may have saved locally.

3. **Run the development server**:

```bash
   npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Verify code quality**:

```bash
   npm run lint
   npm run build
```

---

## Notes for Contributors

- This is a **team learning project** — first time several of us are working in these roles, PM included. Ask questions early rather than guessing on scope; if something feels like it might be over-engineering, flag it before building.
- Stick to Core MVP unless a lead has explicitly signed off on adding something (see the notifications inbox in this README's Core MVP section as an example of a feature added _after_ lead review, not before).
- Edge Functions + Database Webhooks + Resend follow the same pattern across features (e.g. ticket confirmation, OTP, admin notifications) — check an existing implementation before building a new one from scratch.
